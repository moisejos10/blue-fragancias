const crypto = require('node:crypto');
const argon2 = require('argon2');
const { rateLimit } = require('express-rate-limit');

const COOKIE = 'blue_admin';
const TTL = 8 * 60 * 60 * 1000;
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const passwordOptions = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };
// Verificar un hash aun cuando no exista el email evita el atajo de tiempo mas obvio.
let dummyHash;
function cookieToken(req) {
  const part = (req.headers.cookie || '').split(';').map(p => p.trim()).find(p => p.startsWith(`${COOKIE}=`));
  const value = part?.slice(COOKIE.length + 1);
  return /^[a-f0-9]{64}$/.test(value || '') ? value : null;
}

function adminAuth(pool, options = {}) {
  const secure = options.secureCookies ?? process.env.NODE_ENV === 'production';
  const origins = new Set(options.allowedOrigins || (process.env.ADMIN_ORIGINS ||
    (secure ? '' : 'http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:3000,http://localhost:3000')).split(',').filter(Boolean));
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/api/admin' };
  const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10,
    standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: 'Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.' } });

  function origin(req, res, next) {
    res.set('Cache-Control', 'no-store');
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !origins.has(req.get('origin'))) {
      return res.status(403).json({ error: 'Origen de la solicitud no permitido.' });
    }
    next();
  }
  async function requireSession(req, res, next) {
    const token = cookieToken(req);
    if (!token) return res.status(401).json({ error: 'Inicia sesión para continuar.' });
    const { rows } = await pool.query(`SELECT a.id, a.nombre, a.email, s.csrf_token
      FROM public.sesiones_admin s JOIN public.administradores a ON a.id = s.administrador_id
      WHERE s.token_hash = $1 AND s.vence_en > now() AND a.activo`, [hash(token)]);
    if (!rows.length) return res.status(401).json({ error: 'La sesión venció. Vuelve a iniciar sesión.' });
    req.admin = rows[0];
    req.sessionHash = hash(token);
    if (!['GET', 'HEAD'].includes(req.method) && req.get('x-csrf-token') !== req.admin.csrf_token) {
      return res.status(403).json({ error: 'Recarga el panel antes de guardar los cambios.' });
    }
    next();
  }
  async function login(req, res) {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || email.length > 254 || typeof password !== 'string' ||
        password.length < 1 || password.length > 128) {
      return res.status(400).json({ error: 'Introduce correo y contraseña válidos.' });
    }
    const { rows } = await pool.query(`SELECT id, nombre, email, hash_password, activo
      FROM public.administradores WHERE email = $1`, [email.trim().toLowerCase()]);
    dummyHash ||= argon2.hash(crypto.randomBytes(32).toString('hex'), passwordOptions);
    const user = rows[0];
    const verified = await argon2.verify(user?.hash_password || await dummyHash, password);
    if (!user?.activo || !verified) return res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
    const token = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(32).toString('hex');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM public.sesiones_admin WHERE vence_en <= now()');
      const oldToken = cookieToken(req);
      if (oldToken) await client.query('DELETE FROM public.sesiones_admin WHERE token_hash=$1', [hash(oldToken)]);
      await client.query(`INSERT INTO public.sesiones_admin(token_hash,administrador_id,csrf_token,vence_en)
        VALUES ($1,$2,$3,$4)`, [hash(token), user.id, csrf, new Date(Date.now() + TTL)]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    res.cookie(COOKIE, token, { ...cookieOptions, maxAge: TTL });
    res.json({ administrador: { id: user.id, nombre: user.nombre, email: user.email }, csrf });
  }
  async function logout(req, res) {
    await pool.query('DELETE FROM public.sesiones_admin WHERE token_hash = $1', [req.sessionHash]);
    res.clearCookie(COOKIE, cookieOptions);
    res.sendStatus(204);
  }
  return { origin, loginLimit, login, requireSession, logout };
}

module.exports = { adminAuth, passwordOptions };
