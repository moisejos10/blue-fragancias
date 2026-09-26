// Integracion de BF-010. La invoca test-schema.cjs SOLO en su servidor desechable.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const { Client } = require('pg');
const { createPool } = require('../src/db');
const { createApp } = require('../src/app');

async function openHttp(pool) {
  const server = createApp(pool).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

async function closeHttp(server) {
  if (server) await new Promise((resolve) => server.close(resolve));
}

module.exports = async function testBackend({ run, connection, port, password }) {
  const admin = new Client({
    host: '127.0.0.1', port, database: 'blue_fragancias',
    user: 'bf_schema_test', password,
    connectionTimeoutMillis: 3000,
  });
  let pool;
  let failedPool;
  let http;
  let failedHttp;
  const appPassword = crypto.randomBytes(32).toString('hex');
  const migration = (allowFailure = false) => run('psql', [
    ...connection, '-d', 'blue_fragancias',
    '-f', path.join(__dirname, '002_rol_backend.sql'),
  ], allowFailure);

  try {
    await admin.connect();
    // Comprobar rollback si PUBLIC expone una columna privada, sin tocar datos.
    await admin.query('GRANT SELECT (nombre_cliente) ON public.pedidos TO PUBLIC');
    const leaked = migration(true);
    assert.notEqual(leaked.status, 0);
    assert.match(leaked.stderr, /Lectura privada heredada/);
    const absent = await admin.query(
      'SELECT count(*)::integer AS cantidad FROM pg_roles WHERE rolname = $1',
      ['blue_fragancias_app'],
    );
    assert.equal(absent.rows[0].cantidad, 0, 'La migracion fallida revierte el rol');
    await admin.query('REVOKE SELECT (nombre_cliente) ON public.pedidos FROM PUBLIC');
    migration();

    // Valor aleatorio hexadecimal interno: nunca procede del usuario ni se imprime.
    // DDL no admite un parametro de contraseña; se envia por la conexion, no por argv.
    await admin.query(`ALTER ROLE blue_fragancias_app PASSWORD '${appPassword}'`);
    const duplicate = migration(true);
    assert.notEqual(duplicate.status, 0);
    assert.match(duplicate.stderr, /ya existe/);

    const database = {
      host: '127.0.0.1', port, database: 'blue_fragancias',
      user: 'blue_fragancias_app', password: appPassword,
    };
    pool = createPool(database);
    const identity = await pool.query('SELECT current_user AS usuario');
    assert.equal(identity.rows[0].usuario, 'blue_fragancias_app');
    const role = await pool.query(`SELECT rolsuper, rolcreatedb, rolcreaterole,
      rolreplication, rolbypassrls FROM pg_roles WHERE rolname = current_user`);
    assert.ok(Object.values(role.rows[0]).every((value) => value === false));
    for (const table of ['marcas', 'productos', 'variantes_producto', 'imagenes_producto']) {
      const result = await pool.query(`SELECT 1 FROM public.${table} LIMIT 1`);
      assert.equal(result.rows.length, 0, 'El catalogo temporal empieza vacio');
    }

    for (const table of ['administradores', 'tasas_cambio', 'pedidos', 'detalle_pedidos',
      'pagos', 'movimientos_inventario', 'historial_pedidos']) {
      await assert.rejects(pool.query(`SELECT 1 FROM public.${table} LIMIT 1`), { code: '42501' });
    }
    for (const command of [
      "INSERT INTO public.marcas (nombre) VALUES ('No debe insertarse')",
      'UPDATE public.variantes_producto SET stock_fisico = 1 WHERE false',
      'DELETE FROM public.productos WHERE false',
      'TRUNCATE public.marcas CASCADE',
      'CREATE TABLE public.bf_no_autorizada (id integer)',
      'SET ROLE bf_schema_test',
    ]) {
      await assert.rejects(pool.query(command), { code: '42501' });
    }
    await admin.query('CREATE TABLE public.bf_tabla_futura (id integer)');
    await assert.rejects(pool.query('SELECT * FROM public.bf_tabla_futura'), { code: '42501' });
    await admin.query('DROP TABLE public.bf_tabla_futura');
    console.log('Rol autenticado: catalogo legible, tablas privadas/escrituras denegadas y repeticion segura: OK');

    http = await openHttp(pool);
    const healthy = await fetch(`${http.url}/api/health/db`, { signal: AbortSignal.timeout(10000) });
    assert.equal(healthy.status, 200);
    assert.deepEqual(await healthy.json(), { status: 'ok' });
    assert.equal(healthy.headers.get('cache-control'), 'no-store');

    failedPool = createPool({ ...database, password: crypto.randomBytes(32).toString('hex') });
    failedHttp = await openHttp(failedPool);
    const unhealthy = await fetch(`${failedHttp.url}/api/health/db`, { signal: AbortSignal.timeout(10000) });
    assert.equal(unhealthy.status, 503);
    assert.deepEqual(await unhealthy.json(), { status: 'unavailable' });
    const live = await fetch(`${failedHttp.url}/api/health`, { signal: AbortSignal.timeout(10000) });
    assert.equal(live.status, 200);
    console.log('Express + pool PostgreSQL: HTTP 200 con catalogo vacio y 503 saneado con autenticacion fallida: OK');
  } finally {
    await closeHttp(http?.server);
    await closeHttp(failedHttp?.server);
    if (pool) await pool.end();
    if (failedPool) await failedPool.end();
    await admin.end();
  }
};
