// Solo se invoca desde test-backend.cjs en el PostgreSQL temporal del ejecutor.
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createApp } = require('../src/app');

module.exports = async function testCatalogo(admin, pool, baseUrl) {
  const empty = await fetch(`${baseUrl}/api/productos`);
  assert.equal(empty.status, 200);
  assert.deepEqual(await empty.json(), {
    productos: [], paginacion: { pagina: 1, limite: 20, hay_mas: false },
  });

  // Guardia adicional: nunca sembrar fixtures en el servicio habitual.
  const guard = await admin.query(`SELECT current_user AS usuario,
    current_setting('data_directory') AS directorio`);
  assert.equal(guard.rows[0].usuario, 'bf_schema_test');
  assert.match(guard.rows[0].directorio.replaceAll('\\', '/'), /\/\.tmp\/postgres-schema-[^/]+\/data$/);
  let server;
  await admin.query('BEGIN');
  try {
    // IDs explicitos: el rollback tampoco deja avanzadas las secuencias.
    await admin.query(`
      INSERT INTO public.administradores (id, nombre, email, hash_password)
        VALUES ('00000000-0000-0000-0000-000000000099', 'Fixture temporal',
          'fixture@example.invalid', '$argon2id$fixture-no-autenticable');
      INSERT INTO public.marcas (id, nombre) OVERRIDING SYSTEM VALUE
        VALUES (9007199254740993, 'Marca temporal');
      INSERT INTO public.productos (id, marca_id, nombre, slug, activo, genero, descripcion, familia_olfativa)
        OVERRIDING SYSTEM VALUE VALUES
        (9007199254740993, 9007199254740993, 'Perfume temporal', 'perfume-temporal', true,
          'masculino', 'Notas citricas 50% lote_A!', 'amaderada'),
        (9007199254740994, 9007199254740993, 'Sin presentaciones', 'sin-presentaciones', true,
          'unisex', '', NULL),
        (9007199254740995, 9007199254740993, 'Borrador privado', 'borrador-privado', false,
          'femenino', '', NULL);
      INSERT INTO public.variantes_producto
        (id, producto_id, sku, presentacion, tipo_presentacion, volumen_ml, precio_ref_usd, activo)
        OVERRIDING SYSTEM VALUE VALUES
        (9007199254740993, 9007199254740993, 'TEMP-A', 'Presentacion A', 'frasco', 12.50, 9999999999.99, true),
        (9007199254740994, 9007199254740993, 'TEMP-B', 'Oculta', 'muestra', 2, 4, false),
        (9007199254740995, 9007199254740993, 'TEMP-C', 'Sin stock', 'decant', 5, 10, true);
      INSERT INTO public.imagenes_producto
        (id, producto_id, clave_archivo, texto_alternativo, orden)
        OVERRIDING SYSTEM VALUE VALUES
        (9007199254740993, 9007199254740993, 'temporal/segunda.jpg', 'Segunda', 3),
        (9007199254740994, 9007199254740993, 'temporal/primera.jpg', 'Primera', 0);
      INSERT INTO public.movimientos_inventario
        (id, clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id)
        OVERRIDING SYSTEM VALUE VALUES
        (9007199254740993, gen_random_uuid(), 9007199254740993, 'entrada', 3, 'Fixture temporal',
          '00000000-0000-0000-0000-000000000099');
      SET LOCAL ROLE blue_fragancias_app;
    `);
    // La misma transaccion ve sus fixtures sin commit, con los permisos del rol real.
    assert.equal((await admin.query('SELECT current_user AS usuario')).rows[0].usuario, 'blue_fragancias_app');
    server = createApp(admin).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/api/productos`;
    const response = await fetch(`${url}?limite=1`);
    assert.equal(response.status, 200);
    const page = await response.json();
    assert.deepEqual(page.paginacion, { pagina: 1, limite: 1, hay_mas: true });
    assert.equal(page.productos.length, 1);
    const product = page.productos[0];
    assert.deepEqual(Object.keys(product).sort(), [
      'id', 'nombre', 'slug', 'descripcion', 'genero', 'familia_olfativa', 'marca', 'variantes', 'imagenes',
    ].sort());
    assert.equal(product.id, '9007199254740993');
    assert.deepEqual(product.marca, { id: '9007199254740993', nombre: 'Marca temporal' });
    assert.equal(product.variantes.length, 2);
    assert.deepEqual(product.variantes[0], {
      id: '9007199254740993', presentacion: 'Presentacion A', tipo_presentacion: 'frasco',
      concentracion: null, volumen_ml: '12.50', precio_ref_usd: '9999999999.99', disponible: true,
    });
    assert.equal(product.variantes[1].disponible, false);
    assert.deepEqual(product.imagenes.map(i => i.orden), [0, 3]);
    const second = await (await fetch(`${url}?limite=1&pagina=2`)).json();
    assert.deepEqual(second.paginacion, { pagina: 2, limite: 1, hay_mas: false });
    assert.equal(second.productos[0].id, '9007199254740994');
    assert.deepEqual(second.productos[0].variantes, []);
    assert.deepEqual(second.productos[0].imagenes, []);
    const beyond = await (await fetch(`${url}?limite=1&pagina=3`)).json();
    assert.deepEqual(beyond.productos, []);
    assert.equal(beyond.paginacion.hay_mas, false);

    // Consultas HTTP contra SQL real: coincidencias, combinaciones y texto literal.
    const firstId = '9007199254740993';
    const secondId = '9007199254740994';
    for (const [params, expected] of [
      [{ q: 'PERFUME' }, [firstId]],
      [{ q: 'citricas' }, [firstId]],
      [{ q: 'amaderada' }, [firstId]],
      [{ q: 'MARCA TEMPORAL' }, [firstId, secondId]],
      [{ marca: '  MARCA TEMPORAL  ' }, [firstId, secondId]],
      [{ marca: 'Marca' }, []],
      [{ genero: 'masculino' }, [firstId]],
      [{ genero: 'unisex' }, [secondId]],
      [{ genero: 'femenino' }, []],
      [{ tipo: 'frasco' }, [firstId]],
      [{ tipo: 'decant' }, [firstId]],
      [{ tipo: 'muestra' }, []], // La unica muestra esta inactiva.
      [{ q: 'perfume', marca: 'Marca temporal', genero: 'masculino', tipo: 'frasco' }, [firstId]],
      [{ q: 'perfume', genero: 'unisex' }, []],
      [{ q: 'Borrador privado' }, []],
      [{ q: '%' }, [firstId]],
      [{ q: '_' }, [firstId]],
      [{ q: '!' }, [firstId]],
      [{ q: '\\' }, []],
      [{ q: "' OR true --" }, []],
    ]) {
      const filteredResponse = await fetch(`${url}?${new URLSearchParams(params)}`);
      assert.equal(filteredResponse.status, 200, JSON.stringify(params));
      const filtered = await filteredResponse.json();
      assert.deepEqual(filtered.productos.map(p => p.id), expected, JSON.stringify(params));
      assert.equal(filtered.paginacion.hay_mas, false);
      if (params.tipo && expected.length) assert.equal(filtered.productos[0].variantes.length, 2);
    }
    const filteredPage = await (await fetch(`${url}?genero=unisex&limite=1`)).json();
    assert.deepEqual(filteredPage.productos.map(p => p.id), [secondId]);
    assert.equal(filteredPage.paginacion.hay_mas, false);
    const filteredSecond = await (await fetch(`${url}?q=marca&limite=1&pagina=2`)).json();
    assert.deepEqual(filteredSecond.productos.map(p => p.id), [secondId]);
    assert.equal(filteredSecond.paginacion.hay_mas, false);
  } finally {
    if (server) await new Promise(resolve => server.close(resolve));
    await admin.query('ROLLBACK');
  }
  assert.equal((await pool.query('SELECT count(*)::integer AS n FROM public.productos')).rows[0].n, 0);
  console.log('Catalogo HTTP: activos, variantes, precision, imagenes, filtros, busqueda literal, paginacion y rollback: OK');
};
