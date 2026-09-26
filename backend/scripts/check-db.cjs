// Comprobacion local: no imprime credenciales ni filas del catalogo.
const { loadConfig } = require('../src/config');
const { createPool } = require('../src/db');

async function main() {
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const pool = createPool(config.database);
  try {
    const identity = await pool.query(
      'SELECT current_user = $1 AS usuario_correcto, current_database() = $2 AS base_correcta',
      ['blue_fragancias_app', 'blue_fragancias'],
    );
    if (!identity.rows[0].usuario_correcto || !identity.rows[0].base_correcta) {
      console.error('La conexion no usa el usuario o la base de datos previstos.');
      process.exitCode = 1;
      return;
    }
    for (const table of ['marcas', 'productos', 'variantes_producto', 'imagenes_producto']) {
      // Identificadores definidos en este archivo, nunca recibidos del cliente.
      await pool.query(`SELECT 1 FROM public.${table} LIMIT 1`);
    }
    console.log('Conexion con blue_fragancias_app y lectura de las 4 tablas del catalogo: OK');
  } catch {
    console.error('No se pudo consultar PostgreSQL. Revisa el servicio, .env y los permisos del usuario.');
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error('No se pudo completar la comprobacion de PostgreSQL.');
  process.exitCode = 1;
});
