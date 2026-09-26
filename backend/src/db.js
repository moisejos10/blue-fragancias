const { Pool } = require("pg");

function createPool(config) {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    application_name: "blue_fragancias_backend",
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 3000,
    statement_timeout: 5000,
    query_timeout: 6000,
  });

  // Los errores de una conexión inactiva también deben tener un manejador.
  // No imprimir el objeto error: podría contener datos privados de conexión.
  pool.on("error", () => {
    console.error("Se interrumpió una conexión inactiva con PostgreSQL.");
  });

  return pool;
}

module.exports = { createPool };
