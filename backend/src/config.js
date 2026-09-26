const APP_DATABASE_USER = "blue_fragancias_app";

function requiredValue(env, name) {
  const value = env[name];

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Falta configurar ${name} en el entorno del backend.`);
  }

  return value;
}

function parsePort(value, name) {
  if (!/^\d+$/.test(value)) {
    throw new Error(`${name} debe ser un puerto entero entre 1 y 65535.`);
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`${name} debe ser un puerto entero entre 1 y 65535.`);
  }

  return port;
}

function loadConfig(env = process.env) {
  const user = requiredValue(env, "PGUSER").trim();

  if (user !== APP_DATABASE_USER) {
    throw new Error(`PGUSER debe usar el rol limitado ${APP_DATABASE_USER}.`);
  }

  return {
    port: parsePort(env.PORT ?? "3000", "PORT"),
    database: {
      host: requiredValue(env, "PGHOST").trim(),
      port: parsePort(requiredValue(env, "PGPORT"), "PGPORT"),
      database: requiredValue(env, "PGDATABASE").trim(),
      user,
      // La contraseña se conserva exactamente como fue configurada.
      password: requiredValue(env, "PGPASSWORD"),
    },
  };
}

module.exports = { loadConfig };
