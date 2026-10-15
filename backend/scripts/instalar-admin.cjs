const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { loadConfig } = require('../src/config');

try {
  if (!process.stdin.isTTY) throw new Error('Ejecuta este comando en una terminal interactiva local.');
  const { database } = loadConfig();
  const env = { ...process.env };
  delete env.PGPASSWORD;
  const executable = path.join(process.env.PG_BIN || 'C:/Program Files/PostgreSQL/18/bin', 'psql.exe');
  console.log('Preparación única del panel: PostgreSQL solicitará la contraseña de su administrador postgres.');
  const result = spawnSync(executable, ['-X','-W','-h',database.host,'-p',String(database.port),
    '-U','postgres','-d',database.database,'-v','ON_ERROR_STOP=1','-f',
    path.join(__dirname,'../database/003_administracion_catalogo.sql')], { env, stdio: 'inherit', windowsHide: true });
  if (result.error || result.status !== 0) throw new Error('La preparación no terminó. Revisa el mensaje de PostgreSQL; no repitas 001 ni 002.');
  console.log('Preparación completa. Ahora ejecuta npm run admin:crear para elegir tu acceso al panel.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
