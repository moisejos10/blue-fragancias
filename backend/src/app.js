const express = require("express");

function createApp(pool) {
  const app = express();

  app.disable("x-powered-by");
  app.use(express.json());

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

  return app;
}

module.exports = { createApp };
