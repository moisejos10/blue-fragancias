const { publicImageUrl } = require('./media');
// Solo campos del catalogo publico. IDs y decimales se conservan como texto.
const CATALOGO_SQL = `
  SELECT p.id::text AS id, p.nombre, p.slug, p.descripcion,
    p.genero, p.familia_olfativa,
    jsonb_build_object('id', m.id::text, 'nombre', m.nombre) AS marca,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', v.id::text,
        'presentacion', v.presentacion,
        'tipo_presentacion', v.tipo_presentacion,
        'concentracion', v.concentracion,
        'volumen_ml', v.volumen_ml::text,
        'precio_ref_usd', v.precio_ref_usd::text,
        'disponible', (v.stock_fisico - v.stock_reservado) > 0
      ) ORDER BY v.id)
      FROM public.variantes_producto v
      WHERE v.producto_id = p.id AND v.activo = $1
    ), '[]'::jsonb) AS variantes,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', i.id::text, 'clave_archivo', i.clave_archivo,
        'texto_alternativo', i.texto_alternativo, 'orden', i.orden
      ) ORDER BY i.orden, i.id)
      FROM public.imagenes_producto i WHERE i.producto_id = p.id
    ), '[]'::jsonb) AS imagenes
  FROM public.productos p
  JOIN public.marcas m ON m.id = p.marca_id
  WHERE p.activo = $1
    AND ($2::text IS NULL OR concat_ws(' ', p.nombre, p.descripcion, p.familia_olfativa, m.nombre) ILIKE $2 ESCAPE '!')
    AND ($3::text IS NULL OR p.genero = $3)
    AND ($4::text IS NULL OR lower(m.nombre) = lower($4))
    AND ($5::text IS NULL OR EXISTS (
      SELECT 1 FROM public.variantes_producto vf
      WHERE vf.producto_id = p.id AND vf.activo = $1 AND vf.tipo_presentacion = $5
    ))
  ORDER BY p.id
  LIMIT $6 OFFSET $7
`;

const GENEROS = new Set(['femenino', 'masculino', 'unisex']);
const TIPOS_PRESENTACION = new Set(['frasco', 'decant', 'muestra']);

function optionalText(value, maxLength) {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.includes('\u0000') ||
      value.trim() === '' || value.trim().length > maxLength) return null;
  return value.trim();
}

function integerParameter(value, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number <= maximum ? number : null;
}

function catalogoHandler(pool) {
  return async (req, res) => {
    res.set('Cache-Control', 'no-store');
    const pagina = integerParameter(req.query.pagina, 1, 10000);
    const limite = integerParameter(req.query.limite, 20, 50);
    const q = optionalText(req.query.q, 100);
    const marca = optionalText(req.query.marca, 100);
    const genero = optionalText(req.query.genero, 15);
    const tipo = optionalText(req.query.tipo, 15);
    const unknown = Object.keys(req.query).some(key => !['pagina', 'limite', 'q', 'marca', 'genero', 'tipo'].includes(key));
    if (pagina === null || limite === null || q === null || marca === null ||
        genero === null || tipo === null || (genero && !GENEROS.has(genero)) ||
        (tipo && !TIPOS_PRESENTACION.has(tipo)) || unknown) {
      return res.status(400).json({
        error: 'Parametros invalidos. Revisa pagina, limite, q, marca, genero o tipo.',
      });
    }

    try {
      // Una fila adicional permite indicar si hay otra pagina sin contar todo.
      const { rows } = await pool.query(CATALOGO_SQL, [
        // Escapar comodines: buscar '%' o '_' debe encontrar esos caracteres.
        true, q ? `%${q.replace(/[!%_]/g, '!$&')}%` : null,
        genero || null, marca || null, tipo || null,
        limite + 1, (pagina - 1) * limite,
      ]);
      return res.json({
        productos: rows.slice(0, limite).map(p => ({ ...p,
          ...(p.imagenes ? { imagenes: p.imagenes.map(i => ({ ...i, url: publicImageUrl(i.clave_archivo) })) } : {}),
        })),
        paginacion: { pagina, limite, hay_mas: rows.length > limite },
      });
    } catch {
      return res.status(503).json({ error: 'El catalogo no esta disponible temporalmente.' });
    }
  };
}

module.exports = { catalogoHandler };
