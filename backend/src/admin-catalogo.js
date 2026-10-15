const crypto = require('node:crypto');
const express = require('express');
const { adminAuth } = require('./admin-auth');
const { configureMedia } = require('./media');

function invalid(message) { const error = new Error(message); error.status = 400; throw error; }
function text(value, label, max, required = true) {
  if (typeof value !== 'string' || value.includes('\u0000') || value.trim().length > max || (required && !value.trim())) {
    invalid(`Revisa ${label}.`);
  }
  return value.trim();
}
function id(value) {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) invalid('Identificador inválido.');
  return value;
}
function decimal(value, label, digits) {
  if (typeof value !== 'string' || !new RegExp(`^\\d{1,${digits}}(\\.\\d{1,2})?$`).test(value) || Number(value) <= 0) {
    invalid(`${label} debe ser mayor que cero y tener hasta dos decimales.`);
  }
  return value;
}
function productInput(body) {
  if (!body || typeof body !== 'object') invalid('Producto inválido.');
  const result = {
    nombre: text(body.nombre, 'el nombre', 180), marca: text(body.marca, 'la marca', 100),
    descripcion: text(body.descripcion, 'la descripción', 5000, false),
    familia_olfativa: text(body.familia_olfativa, 'la familia olfativa', 80, false) || null,
    genero: body.genero || null, activo: body.activo,
  };
  if (![null, 'femenino', 'masculino', 'unisex'].includes(result.genero) || typeof result.activo !== 'boolean') invalid('Género o publicación inválidos.');
  if (!Array.isArray(body.variantes) || body.variantes.length > 30) invalid('Se admiten hasta 30 presentaciones.');
  result.variantes = body.variantes.map(v => {
    if (!v || typeof v !== 'object') invalid('Presentación inválida.');
    if (!['frasco', 'decant', 'muestra'].includes(v.tipo_presentacion) || typeof v.activo !== 'boolean') invalid('Tipo de presentación inválido.');
    // Las existencias se gestionan por una ruta de movimientos, nunca por este formulario.
    if ('stock_fisico' in v || 'stock_reservado' in v) invalid('Registra las existencias mediante una entrada de inventario.');
    return { id: v.id == null ? null : id(v.id), presentacion: text(v.presentacion, 'la presentación', 120),
      tipo_presentacion: v.tipo_presentacion, concentracion: text(v.concentracion, 'la concentración', 40, false) || null,
      volumen_ml: decimal(v.volumen_ml, 'El volumen', 6),
      precio_ref_usd: decimal(v.precio_ref_usd, 'El precio', 10), activo: v.activo };
  });
  const ids = result.variantes.filter(v => v.id).map(v => v.id);
  if (new Set(ids).size !== ids.length) invalid('Presentaciones repetidas.');
  if (result.activo && !result.variantes.some(v => v.activo)) invalid('Añade una presentación activa antes de publicar.');
  return result;
}

async function detail(pool, productId) {
  const { rows } = await pool.query(`SELECT p.id::text, p.nombre, p.descripcion, p.genero,
    coalesce(p.familia_olfativa,'') AS familia_olfativa, p.activo, p.actualizado_en::text AS version,
    m.nombre AS marca FROM public.productos p JOIN public.marcas m ON m.id=p.marca_id WHERE p.id=$1`, [productId]);
  if (!rows.length) { const error = new Error('Producto no encontrado.'); error.status = 404; throw error; }
  const variants = await pool.query(`SELECT id::text, presentacion, tipo_presentacion,
    coalesce(concentracion,'') AS concentracion, volumen_ml::text, precio_ref_usd::text,
    activo, stock_fisico, stock_reservado FROM public.variantes_producto WHERE producto_id=$1 ORDER BY id`, [productId]);
  const images = await pool.query(`SELECT id::text, clave_archivo, texto_alternativo FROM public.imagenes_producto
    WHERE producto_id=$1 ORDER BY orden,id`, [productId]);
  return { ...rows[0], variantes: variants.rows, imagenes: images.rows.map(i => ({ ...i, url: `/api/admin/media/${i.clave_archivo}` })) };
}

function configureAdmin(app, pool, options = {}) {
  const router = express.Router();
  const auth = adminAuth(pool, options);
  router.use(auth.origin);
  router.post('/login', auth.loginLimit, auth.login);
  router.use(auth.requireSession);
  router.get('/sesion', (req, res) => res.json({ administrador: { id: req.admin.id, nombre: req.admin.nombre, email: req.admin.email }, csrf: req.admin.csrf_token }));
  router.post('/logout', auth.logout);
  router.get('/productos', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const page = req.query.pagina === undefined ? 1 : Number(req.query.pagina);
    if (q.length > 100 || q.includes('\u0000') || !Number.isInteger(page) || page < 1 || page > 10000) invalid('Búsqueda inválida.');
    const { rows } = await pool.query(`SELECT p.id::text, p.nombre, p.activo, m.nombre AS marca,
      (SELECT count(*)::integer FROM public.variantes_producto v WHERE v.producto_id=p.id) AS presentaciones
      FROM public.productos p JOIN public.marcas m ON m.id=p.marca_id
      WHERE concat_ws(' ',p.nombre,m.nombre) ILIKE $1 ESCAPE '!' ORDER BY p.id DESC LIMIT 21 OFFSET $2`,
    [`%${q.replace(/[!%_]/g, '!$&')}%`, (page - 1) * 20]);
    res.json({ productos: rows.slice(0,20), hay_mas: rows.length > 20 });
  });
  router.get('/productos/:id', async (req, res) => res.json(await detail(pool, id(req.params.id))));

  async function save(req, res) {
    const data = productInput(req.body);
    let productId = req.params.id ? id(req.params.id) : null;
    const creating = !productId;
    if (creating && data.variantes.some(v => v.id)) invalid('Una presentación nueva no tiene identificador.');
    if (!creating && (typeof req.body.version !== 'string' || !/^\d{4}-\d{2}-\d{2} /.test(req.body.version))) invalid('Recarga el producto antes de guardar.');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (productId) {
        const existing = await client.query('SELECT actualizado_en::text AS version FROM public.productos WHERE id=$1 FOR UPDATE', [productId]);
        if (!existing.rows.length) { const e = new Error('Producto no encontrado.'); e.status = 404; throw e; }
        if (existing.rows[0].version !== req.body.version) { const e = new Error('El producto cambió en otra ventana. Recárgalo antes de guardar.'); e.status = 409; throw e; }
      }
      await client.query('INSERT INTO public.marcas(nombre) VALUES ($1) ON CONFLICT DO NOTHING', [data.marca]);
      const brand = (await client.query('SELECT id FROM public.marcas WHERE lower(nombre)=lower($1)', [data.marca])).rows[0];
      const fields = [brand.id, data.nombre, data.descripcion, data.genero, data.familia_olfativa, data.activo];
      if (productId) {
        await client.query(`UPDATE public.productos SET marca_id=$1,nombre=$2,descripcion=$3,genero=$4,
          familia_olfativa=$5,activo=$6 WHERE id=$7`, [...fields, productId]);
      } else {
        const base = data.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,180) || 'perfume';
        productId = (await client.query(`INSERT INTO public.productos(marca_id,nombre,descripcion,genero,familia_olfativa,activo,slug)
          VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id::text`, [...fields, `${base}-${crypto.randomBytes(6).toString('hex')}`])).rows[0].id;
      }
      for (const v of data.variantes) {
        const values = [v.presentacion,v.tipo_presentacion,v.concentracion,v.volumen_ml,v.precio_ref_usd,v.activo];
        if (v.id) {
          const updated = await client.query(`UPDATE public.variantes_producto SET presentacion=$1,tipo_presentacion=$2,
            concentracion=$3,volumen_ml=$4,precio_ref_usd=$5,activo=$6 WHERE id=$7 AND producto_id=$8 RETURNING id`, [...values,v.id,productId]);
          if (!updated.rowCount) invalid('La presentación no pertenece al producto.');
        } else {
          await client.query(`INSERT INTO public.variantes_producto(presentacion,tipo_presentacion,concentracion,volumen_ml,precio_ref_usd,activo,producto_id,sku)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [...values,productId,`BF-${crypto.randomUUID().toUpperCase()}`]);
        }
      }
      const product = await detail(client, productId);
      await client.query('COMMIT');
      res.status(creating ? 201 : 200).json(product);
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
  }
  router.post('/productos', save);
  router.put('/productos/:id', save);
  router.post('/variantes/:id/entradas', async (req,res) => {
    const variantId = id(req.params.id);
    const { cantidad, motivo, clave } = req.body || {};
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 100000 ||
        typeof clave !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clave)) invalid('Cantidad o referencia de entrada inválidas.');
    const reason = text(motivo, 'el motivo de entrada', 500);
    const { rows } = await pool.query('SELECT public.registrar_entrada_catalogo($1,$2,$3,$4,$5)::text AS id', [variantId,cantidad,reason,req.admin.id,clave]);
    res.status(201).json({ movimiento_id: rows[0].id });
  });
  configureMedia(app, router, pool, options, { id, text });
  app.use('/api/admin', router);
}

module.exports = { configureAdmin, productInput };
