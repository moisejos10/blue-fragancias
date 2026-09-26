const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const { createApp } = require("../src/app");

async function startApp(t, pool) {
  const server = createApp(pool).listen(0, "127.0.0.1");
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  await once(server, "listening");
  return `http://127.0.0.1:${server.address().port}`;
}

test("el estado HTTP sigue disponible aunque PostgreSQL no responda", async (t) => {
  let queries = 0;
  const baseUrl = await startApp(t, {
    async query() {
      queries += 1;
      throw new Error("base inaccesible");
    },
  });
  const response = await fetch(`${baseUrl}/api/health`);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: "ok",
    message: "El servidor de Blue Fragancias está funcionando",
  });
  assert.equal(queries, 0);
});

test("la disponibilidad no depende de tener productos ni publica sus datos", async (t) => {
  let calls = 0;
  const baseUrl = await startApp(t, {
    async query(text, values) {
      calls += 1;
      assert.match(text, /public\.productos/);
      assert.match(text, /\$1/);
      assert.deepEqual(values, [true]);
      return { rows: [{ exists: false, private_data: "no publicar" }] };
    },
  });
  const response = await fetch(`${baseUrl}/api/health/db`);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "ok" });
  assert.equal(calls, 1);
});

test("los fallos de PostgreSQL devuelven 503 sin SQL, credenciales ni stack", async (t) => {
  const baseUrl = await startApp(t, {
    async query() {
      const error = new Error("postgres://usuario:secreto@servidor/privada SELECT dato_privado");
      error.detail = "información interna";
      throw error;
    },
  });
  const response = await fetch(`${baseUrl}/api/health/db`);

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.deepEqual(await response.json(), { status: "unavailable" });
});
