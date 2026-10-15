const express = require("express");
const { catalogoHandler } = require("./catalogo");
const { configureAdmin } = require("./admin-catalogo");

function createApp(pool, options = {}) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json({ limit: '256kb' }));
  app.use((req,res,next) => { res.set('X-Content-Type-Options','nosniff'); next(); });

  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      message: "El servidor de Blue Fragancias está funcionando",
    });
  });

  app.get("/api/health/db", async (req, res) => {
    res.set("Cache-Control", "no-store");

    try {
      // Acceder a la tabla comprueba permisos incluso si aún no hay productos.
      await pool.query(
        "SELECT EXISTS (SELECT 1 FROM public.productos WHERE activo = $1)",
        [true],
      );
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  app.get("/api/productos", catalogoHandler(pool));
  configureAdmin(app, pool, options);

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    res.set('Cache-Control','no-store');
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'La imagen debe pesar como máximo 5 MB.' });
    if (error.name === 'MulterError') return res.status(400).json({ error: 'Envía una sola imagen con su descripción.' });
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: 'Datos JSON inválidos.' });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'La solicitud es demasiado grande.' });
    if (error.code === 'ENOENT') return res.status(404).json({ error: 'Imagen no encontrada.' });
    if (error.status && [400,404,409].includes(error.status)) return res.status(error.status).json({ error: error.message });
    if (error.code === '23505') return res.status(409).json({ error: 'Ya existe ese registro o referencia. Revisa los datos.' });
    if (['23514','23503','22003','22P02'].includes(error.code)) return res.status(400).json({ error: 'Los datos no cumplen las reglas del catálogo.' });
    if (['42P01','42883','42501'].includes(error.code) && req.path.startsWith('/api/admin')) {
      return res.status(503).json({ error: 'La administración necesita su configuración inicial. Consulta la guía del panel.' });
    }
    res.status(503).json({ error: 'El servicio no está disponible temporalmente.' });
  });

  return app;
}

module.exports = { createApp };
