// Se ejecuta en una terminal del propietario; nunca solicita claves en el chat.
const readline = require('node:readline');
const { Writable } = require('node:stream');
const argon2 = require('argon2');
const { loadConfig } = require('../src/config');
const { createPool } = require('../src/db');
const { passwordOptions } = require('../src/admin-auth');

async function main() {
  if (!process.stdin.isTTY) throw new Error('Ejecuta este comando en una terminal interactiva local.');
  const output = new Writable({ write(chunk, encoding, done) { if (!this.muted) process.stdout.write(chunk, encoding); done(); } });
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true });
  const question = (prompt, hidden = false) => new Promise(resolve => {
    process.stdout.write(prompt);
    output.muted = hidden;
    rl.question('', answer => { output.muted = false; if (hidden) process.stdout.write('\n'); resolve(answer); });
  });
  let pool;
  try {
    pool = createPool(loadConfig().database);
    const existing = await pool.query('SELECT EXISTS(SELECT 1 FROM public.administradores) AS existe');
    if (existing.rows[0].existe) { console.log('Ya existe un administrador. Usa su cuenta para entrar al panel.'); return; }
    console.log('Crear la primera cuenta del panel. Las contraseñas no se muestran.');
    const nombre = (await question('Tu nombre: ')).trim();
    const email = (await question('Correo para iniciar sesión: ')).trim().toLowerCase();
    const password = await question('Contraseña nueva (12 a 128 caracteres): ', true);
    const confirm = await question('Repite la contraseña: ', true);
    if (!nombre || nombre.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 ||
        password.length < 12 || password.length > 128 || password !== confirm) {
      throw new Error('Revisa el nombre, correo y coincidencia de las contraseñas.');
    }
    const hashed = await argon2.hash(password, passwordOptions);
    await pool.query('SELECT public.crear_primer_administrador($1,$2,$3)', [nombre,email,hashed]);
    console.log('Cuenta creada. Abre http://127.0.0.1:5173/admin para iniciar sesión.');
  } finally { rl.close(); if (pool) await pool.end(); }
}
main().catch(error => {
  if (error.code === '23505') console.error('Ya existe un administrador. Usa su cuenta; no se modificó.');
  else if (error.code) console.error('No se pudo crear la cuenta. Comprueba conexión y migración 003.');
  else console.error(error.message);
  process.exitCode = 1;
});
