const assert = require("node:assert/strict");
const { once } = require("node:events");
const test = require("node:test");
const { createApp } = require("../src/app");

test("catalogo vacio devuelve una pagina valida", async (t) => {
  const url = await startApp(t, { async query() { return { rows: [] }; } });
  const response = await fetch(`${url}/api/productos`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    productos: [], paginacion: { pagina: 1, limite: 20, hay_mas: false },
  });
});

test("catalogo pagina sin devolver la fila adicional", async (t) => {
  const url = await startApp(t, {
    async query(sql, values) {
      assert.deepEqual(values, [true, null, null, null, null, 2, 1]);
      return { rows: [{ id: '2' }, { id: '3' }] };
    },
  });
  const response = await fetch(`${url}/api/productos?pagina=2&limite=1`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    productos: [{ id: '2' }], paginacion: { pagina: 2, limite: 1, hay_mas: true },
  });
});

test("parametros invalidos o duplicados se rechazan sin consultar SQL", async (t) => {
  let calls = 0;
  const url = await startApp(t, { async query() { calls++; return { rows: [] }; } });
  for (const query of ['pagina=0', 'pagina=-1', 'pagina=1.5', 'pagina=1e2',
    'pagina=10001', 'pagina=', 'limite=51', 'limite=0', 'limite=1&limite=2',
    'pagina=1&pagina=2', 'limite[]=1', 'orden=nombre', "pagina=1%3BDROP%20TABLE%20productos",
    'q=', 'q=%20', 'q=%00', `q=${'a'.repeat(101)}`, 'q=a&q=b', 'q[]=a',
    'marca=', 'marca=%00', `marca=${'a'.repeat(101)}`, 'marca=a&marca=b',
    'genero=', 'genero=otro', 'genero=unisex&genero=femenino', 'genero[]=unisex',
    'tipo=', 'tipo=otro', 'tipo=frasco&tipo=decant', 'tipo[]=frasco']) {
    const response = await fetch(`${url}/api/productos?${query}`);
    assert.equal(response.status, 400, query);
    assert.equal(typeof (await response.json()).error, 'string');
  }
  assert.equal(calls, 0);
});

test("catalogo oculta los detalles de un error de base", async (t) => {
  const url = await startApp(t, {
    async query() { throw new Error('password=secreto SELECT tabla_privada'); },
  });
  const response = await fetch(`${url}/api/productos`);
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'El catalogo no esta disponible temporalmente.' });
});

test('el panel rechaza accesos anonimos y origenes externos antes de SQL', async (t) => {
  let calls=0;
  const url=await startApp(t,{async query(){calls++;throw new Error('No debe consultar');}});
  for (const route of ['/api/admin/sesion','/api/admin/productos','/api/admin/media/archivo.webp']) {
    assert.equal((await fetch(url+route)).status,401);
  }
  const external=await fetch(`${url}/api/admin/productos`,{method:'POST',headers:{Origin:'https://externo.invalid','Content-Type':'application/json'},body:'{}'});
  assert.equal(external.status,403);
  assert.equal(calls,0);
});

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
