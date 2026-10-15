const path = require('node:path');
const fs = require('node:fs/promises');
const crypto = require('node:crypto');
const multer = require('multer');
const sharp = require('sharp');

const validFile = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.webp$/;
function publicImageUrl(key) { return validFile.test(key) ? `/media/${key}` : null; }

function configureMedia(app, router, pool, options, validation) {
  const directory = path.resolve(options.mediaDirectory || path.join(__dirname, '../storage/imagenes'));
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 1, parts: 2 } });
  async function imageBuffer(req) {
    if (!req.file) { const e = new Error('Selecciona una imagen JPG, PNG o WebP de hasta 5 MB.'); e.status = 400; throw e; }
    try {
      const input = sharp(req.file.buffer, { limitInputPixels: 20000000, failOn: 'warning' });
      const metadata = await input.metadata();
      if (!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages || 1) > 1) throw new Error('Formato');
      return await input.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
    } catch { const e = new Error('La imagen no es válida. Usa JPG, PNG o WebP estático de hasta 20 megapíxeles.'); e.status = 400; throw e; }
  }
  async function saveImage(req, res, logo = false) {
    const productId = logo ? null : validation.id(req.params.id);
    const alt = logo ? null : validation.text(req.body.texto_alternativo, 'la descripción de la imagen', 250);
    const buffer = await imageBuffer(req);
    const file = `${crypto.randomUUID()}.webp`;
    await fs.mkdir(directory, { recursive: true });
    const client = await pool.connect();
    let written = false;
    let committed = false;
    let oldFile;
    try {
      await client.query('BEGIN');
      if (logo) {
        oldFile = (await client.query('SELECT logo_clave FROM public.configuracion_tienda WHERE id=true FOR UPDATE')).rows[0]?.logo_clave;
      } else {
        const exists = await client.query('SELECT id FROM public.productos WHERE id=$1 FOR UPDATE', [productId]);
        if (!exists.rows.length) { const e = new Error('Producto no encontrado.'); e.status = 404; throw e; }
        oldFile = (await client.query('SELECT clave_archivo FROM public.imagenes_producto WHERE producto_id=$1 AND orden=0', [productId])).rows[0]?.clave_archivo;
      }
      await fs.writeFile(path.join(directory, file), buffer, { flag: 'wx' });
      written = true;
      if (logo) {
        await client.query('UPDATE public.configuracion_tienda SET logo_clave=$1,actualizado_en=now() WHERE id=true', [file]);
      } else {
        await client.query(`INSERT INTO public.imagenes_producto(producto_id,clave_archivo,texto_alternativo,orden)
          VALUES ($1,$2,$3,0) ON CONFLICT (producto_id,orden) DO UPDATE
          SET clave_archivo=EXCLUDED.clave_archivo,texto_alternativo=EXCLUDED.texto_alternativo`, [productId,file,alt]);
      }
      await client.query('COMMIT');
      committed = true;
      if (oldFile && validFile.test(oldFile)) {
        // Destino restringido a un nombre generado. Borrar solo si ya no se referencia.
        try {
          const referenced = await client.query(`SELECT 1 FROM public.imagenes_producto WHERE clave_archivo=$1
            UNION ALL SELECT 1 FROM public.configuracion_tienda WHERE logo_clave=$1 LIMIT 1`, [oldFile]);
          if (!referenced.rows.length) await fs.unlink(path.join(directory, oldFile));
        } catch { /* Un fallo de limpieza no revierte una imagen ya guardada. */ }
      }
      res.status(201).json({ url: `/api/admin/media/${file}` });
    } catch (error) {
      await client.query('ROLLBACK');
      if (written && !committed) await fs.unlink(path.join(directory, file)).catch(() => {});
      throw error;
    } finally { client.release(); }
  }
  router.post('/productos/:id/imagen', upload.single('imagen'), (req,res) => saveImage(req,res));
  router.post('/logo', upload.single('imagen'), (req,res) => saveImage(req,res,true));
  router.get('/media/:file', async (req,res) => {
    if (!validFile.test(req.params.file)) return res.sendStatus(404);
    res.set('X-Content-Type-Options', 'nosniff');
    res.sendFile(req.params.file, { root: directory, dotfiles: 'deny' });
  });
  app.get('/api/tienda', async (req,res) => {
    res.set('Cache-Control','no-store');
    try {
      const { rows } = await pool.query('SELECT logo_clave FROM public.configuracion_tienda WHERE id=true');
      res.json({ logo_url: publicImageUrl(rows[0]?.logo_clave || '') });
    } catch (error) {
      // Compatibilidad mientras la migracion 003 aun no esta instalada.
      if (error.code === '42P01') return res.json({ logo_url: null });
      throw error;
    }
  });
  app.get('/media/:file', async (req,res) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    if (!validFile.test(req.params.file)) return res.sendStatus(404);
    const { rows } = await pool.query(`SELECT 1 FROM public.imagenes_producto i JOIN public.productos p ON p.id=i.producto_id
      WHERE i.clave_archivo=$1 AND p.activo
      UNION ALL SELECT 1 FROM public.configuracion_tienda WHERE logo_clave=$1 LIMIT 1`, [req.params.file]);
    if (!rows.length) return res.sendStatus(404);
    res.sendFile(req.params.file, { root: directory, dotfiles: 'deny' });
  });
}
module.exports = { configureMedia, publicImageUrl };
