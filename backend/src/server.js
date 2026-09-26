const { loadConfig } = require("./config");
const { createPool } = require("./db");
const { createApp } = require("./app");

function startServer() {
  let config;

  try {
    config = loadConfig();
  } catch (error) {
    // loadConfig solo genera mensajes propios sin valores del entorno.
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  let pool;

  try {
    pool = createPool(config.database);
  } catch {
    console.error("No se pudo preparar la conexión con PostgreSQL.");
    process.exitCode = 1;
    return;
  }

  const server = createApp(pool).listen(config.port, (error) => {
    if (!error) {
      console.log(`Servidor disponible en http://localhost:${config.port}`);
    }
  });
  let closing = false;

  async function shutdown(exitCode = 0) {
    if (closing) return;
    closing = true;
    process.exitCode = exitCode;

    const deadline = setTimeout(() => {
      console.error("Se agotó el tiempo disponible para cerrar el servidor.");
      process.exit(1);
    }, 10000);
    deadline.unref();

    try {
      await new Promise((resolve) => server.close(resolve));
      await pool.end();
    } catch {
      console.error("No se pudo completar el cierre del servidor.");
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  }

  server.on("error", () => {
    console.error("No se pudo iniciar el servidor HTTP. Revisa el puerto configurado.");
    void shutdown(1);
  });
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };
