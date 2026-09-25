// Pruebas reales en un PostgreSQL desechable, sin usar el servicio ni su contrasena.
// Requiere Node.js y los binarios de PostgreSQL 18. No instala dependencias.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync, spawn } = require('node:child_process');

const bin = process.env.PG_BIN || 'C:\\Program Files\\PostgreSQL\\18\\bin';
const root = path.resolve(__dirname, '../../.tmp');
fs.mkdirSync(root, { recursive: true });
const scratch = fs.mkdtempSync(path.join(root, 'postgres-schema-'));
const data = path.join(scratch, 'data');
const password = crypto.randomBytes(32).toString('hex');
const env = { ...process.env, PGPASSWORD: password, PGCLIENTENCODING: 'UTF8' };
let started = false;
let connection;

function run(tool, args, allowFailure = false) {
  // En Windows el servidor puede heredar los pipes de pg_ctl y mantenerlos abiertos.
  // Capturar pg_ctl en un archivo permite que spawnSync termine al salir pg_ctl.
  const capture = tool === 'pg_ctl' ? path.join(scratch, `control-${crypto.randomUUID()}.log`) : null;
  const fd = capture ? fs.openSync(capture, 'w') : null;
  let result;
  try {
    result = spawnSync(path.join(bin, `${tool}.exe`), args, {
      env, encoding: 'utf8', windowsHide: true, timeout: 60000,
      ...(fd !== null ? { stdio: ['ignore', fd, fd] } : {}),
    });
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
  if (capture) { result.stdout = fs.readFileSync(capture, 'utf8'); result.stderr = ''; }
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`${tool} fallo (${result.status}):\n${result.stdout}\n${result.stderr}`);
  }
  return result;
}

function sql(command, allowFailure = false) {
  return run('psql', [...connection, '-d', 'blue_fragancias', '-Atq', '-c', command], allowFailure);
}

function asyncSql(command) {
  const child = spawn(path.join(bin, 'psql.exe'), [
    ...connection, '-d', 'blue_fragancias', '-Atq', '-c', command,
  ], { env, windowsHide: true });
  let output = '';
  let signal;
  const reserved = new Promise(resolve => { signal = resolve; });
  const timer = setTimeout(() => child.kill(), 15000);
  const done = new Promise((resolve, reject) => {
    child.stdout.on('data', chunk => {
      output += chunk.toString();
      if (output.includes('RESERVA_LISTA')) signal();
    });
    child.stderr.on('data', chunk => { output += chunk.toString(); });
    child.on('error', reject);
    child.on('close', code => {
      clearTimeout(timer);
      signal();
      resolve({ code, output });
    });
  });
  return { reserved, done };
}

async function main() {
  const port = await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const selected = server.address().port;
      server.close(error => error ? reject(error) : resolve(selected));
    });
  });
  const pwfile = path.join(scratch, 'password.txt');
  fs.writeFileSync(pwfile, password + '\n');
  run('initdb', ['-D', data, '-U', 'bf_schema_test', '--auth=scram-sha-256',
    `--pwfile=${pwfile}`, '--encoding=UTF8', '--locale=C']);
  fs.unlinkSync(pwfile);
  started = true; // Intentar detenerlo incluso si pg_ctl vence su tiempo de espera.
  run('pg_ctl', ['-D', data, '-l', path.join(scratch, 'server.log'), '-w',
    '-o', `-h 127.0.0.1 -p ${port}`, 'start']);
  connection = ['-X', '-w', '-h', '127.0.0.1', '-p', String(port), '-U', 'bf_schema_test',
    '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose'];
  run('psql', [...connection, '-d', 'postgres', '-f', path.join(__dirname, 'instalar.sql')]);
  assert.equal(sql("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'").stdout.trim(), '11');
  console.log('Instalacion completa de las 11 tablas: OK');
  run('psql', [...connection, '-d', 'blue_fragancias', '-f', path.join(__dirname, 'pruebas.sql')]);
  console.log('Restricciones, calculos, snapshots, pagos e inventario: OK');

  const rerun = run('psql', [...connection, '-d', 'blue_fragancias', '-f', path.join(__dirname, '001_esquema_inicial.sql')], true);
  assert.notEqual(rerun.status, 0, 'No debe sobrescribir un esquema existente');
  assert.equal(sql('SELECT count(*) FROM pedidos').stdout.trim(), '5');
  console.log('Reejecucion rechazada sin borrar los datos: OK');

  const invalidSubtotal = sql("BEGIN; UPDATE pedidos SET subtotal_ref_usd = 999 WHERE id = '00000000-0000-0000-0000-000000000021'; COMMIT;", true);
  assert.notEqual(invalidSubtotal.status, 0);
  assert.match(invalidSubtotal.stderr, /23514/);
  assert.equal(sql("SELECT subtotal_ref_usd FROM pedidos WHERE id = '00000000-0000-0000-0000-000000000021'").stdout.trim(), '10.00');
  console.log('Subtotal inconsistente rechazado al COMMIT: OK');

  function reserve(order) {
    return `INSERT INTO movimientos_inventario (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
      VALUES (gen_random_uuid(), 2, '00000000-0000-0000-0000-${order}', 'reserva', 1, 'Prueba simultanea');`;
  }
  const first = asyncSql(`BEGIN; ${reserve('000000000021')} SELECT 'RESERVA_LISTA'; SELECT pg_sleep(1); COMMIT;`);
  await first.reserved;
  const second = asyncSql(`BEGIN; ${reserve('000000000022')} COMMIT;`);
  const [a, b] = await Promise.all([first.done, second.done]);
  assert.equal(a.code, 0, a.output);
  assert.notEqual(b.code, 0, 'Solo un pedido puede reservar la ultima unidad');
  assert.match(b.output, /23514/);
  assert.equal(sql('SELECT stock_fisico, stock_reservado FROM variantes_producto WHERE id = 2').stdout.trim(), '1|1');
  assert.equal(sql("SELECT count(*) FROM movimientos_inventario WHERE variante_id = 2 AND tipo = 'reserva'").stdout.trim(), '1');
  console.log('Dos conexiones compiten por la ultima unidad; solo una reserva prospera: OK');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => {
  let safeToRemove = true;
  if (started) {
    try { run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']); }
    catch (error) { console.error(error.message); safeToRemove = false; process.exitCode = 1; }
  }
  // Verificar el destino absoluto antes de borrar SOLO el directorio creado por esta prueba.
  const target = path.resolve(scratch);
  if (safeToRemove && target.startsWith(root + path.sep)
      && path.basename(target).startsWith('postgres-schema-')) {
    try { fs.rmSync(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); }
    catch (error) { console.error(`No se pudo limpiar ${target}: ${error.message}`); process.exitCode = 1; }
  } else {
    console.error(`Servidor de prueba pendiente de limpieza: ${target}`);
  }
});
