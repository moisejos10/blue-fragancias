// Exclusivamente el servidor desechable de test-schema.cjs. Nunca usa .env.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const path = require('node:path');
const fs = require('node:fs/promises');
const { Client } = require('pg');
const argon2 = require('argon2');
const sharp = require('sharp');
const { createPool } = require('../src/db');
const { createApp } = require('../src/app');
const { passwordOptions } = require('../src/admin-auth');

module.exports = async function testAdmin({ run, connection, port, password }) {
  const admin = new Client({ host: '127.0.0.1', port, database: 'blue_fragancias', user: 'bf_schema_test', password });
  let pool, server;
  try {
    await admin.connect();
    const guard = (await admin.query("SELECT current_user AS usuario,current_setting('data_directory') AS directorio")).rows[0];
    assert.equal(guard.usuario,'bf_schema_test');
    assert.match(guard.directorio.replaceAll('\\','/'), /\/\.tmp\/postgres-schema-[^/]+\/data$/);
    run('psql', [...connection,'-d','blue_fragancias','-f',path.join(__dirname,'003_administracion_catalogo.sql')]);
    const dbPassword = crypto.randomBytes(32).toString('hex');
    await admin.query(`ALTER ROLE blue_fragancias_app PASSWORD '${dbPassword}'`);
    pool = createPool({ host: '127.0.0.1',port,database:'blue_fragancias',user:'blue_fragancias_app',password:dbPassword });
    const userPassword = crypto.randomBytes(24).toString('hex');
    const hashed = await argon2.hash(userPassword,passwordOptions);
    // Aislar la inicializacion, restaurando TODOS los fixtures anteriores con ROLLBACK.
    await admin.query('BEGIN');
    try {
      await admin.query('TRUNCATE public.administradores CASCADE');
      await admin.query('SET LOCAL ROLE blue_fragancias_app');
      await admin.query('SELECT public.crear_primer_administrador($1,$2,$3)', ['Inicial','inicial@example.invalid',hashed]);
      assert.equal((await admin.query('SELECT id FROM public.administradores')).rows.length,1);
      await admin.query('SAVEPOINT repetido');
      await assert.rejects(admin.query('SELECT public.crear_primer_administrador($1,$2,$3)', ['Otro','otro@example.invalid',hashed]), { code:'42501' });
      await admin.query('ROLLBACK TO SAVEPOINT repetido');
    } finally { await admin.query('ROLLBACK'); }
    const account = (await admin.query(`INSERT INTO public.administradores(nombre,email,hash_password)
      VALUES ($1,$2,$3) RETURNING id`, ['Admin temporal','admin-panel@example.invalid',hashed])).rows[0];

    for (const query of [
      'UPDATE public.variantes_producto SET stock_fisico=1 WHERE false',
      'UPDATE public.variantes_producto SET stock_reservado=1 WHERE false',
      "INSERT INTO public.variantes_producto(producto_id,sku,presentacion,tipo_presentacion,volumen_ml,precio_ref_usd,stock_fisico) VALUES (1,'NO','No','frasco',1,1,1)",
      'DELETE FROM public.productos WHERE false',
      'INSERT INTO public.movimientos_inventario(clave_idempotencia) VALUES (gen_random_uuid())',
      'UPDATE public.administradores SET activo=false WHERE false',
      'SELECT * FROM public.pagos LIMIT 1',
      'SET ROLE blue_fragancias_inventario',
    ]) await assert.rejects(pool.query(query), { code:'42501' });

    const mediaDirectory = path.join(path.dirname(guard.directorio),'imagenes-prueba');
    const origin = 'http://127.0.0.1:5173';
    server = createApp(pool,{ mediaDirectory, allowedOrigins:[origin],secureCookies:false }).listen(0,'127.0.0.1');
    await new Promise(resolve => server.once('listening',resolve));
    const base = `http://127.0.0.1:${server.address().port}`;
    let cookie = '', csrf = '';
    async function request(route, method='GET', body, extras={}) {
      return fetch(base+route,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),
        ...(csrf?{'X-CSRF-Token':csrf}:{}),...(body?{'Content-Type':'application/json'}:{}),...extras},
      ...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(10000)});
    }
    const json = async response => { const data=await response.json(); assert.ok(response.ok,JSON.stringify(data)); return data; };
    async function login() {
      const response=await request('/api/admin/login','POST',{email:'admin-panel@example.invalid',password:userPassword});
      assert.equal(response.status,200);
      const header=response.headers.get('set-cookie');
      assert.match(header,/HttpOnly/i); assert.match(header,/SameSite=Strict/i);
      cookie=header.split(';')[0]; csrf=(await response.json()).csrf;
    }
    assert.equal((await request('/api/admin/productos')).status,401);
    assert.equal((await request('/api/admin/login','POST',{email:'admin-panel@example.invalid',password:userPassword},{Origin:'https://no-permitido.invalid'})).status,403);
    assert.equal((await request('/api/admin/login','POST',{email:'admin-panel@example.invalid',password:'incorrecta'})).status,401);
    await login();
    assert.equal((await request('/api/admin/sesion')).status,200);
    const stored=(await admin.query('SELECT token_hash FROM public.sesiones_admin WHERE administrador_id=$1',[account.id])).rows[0];
    assert.notEqual(stored.token_hash,cookie.split('=')[1]);
    assert.equal((await request('/api/admin/productos','POST',{}, {'X-CSRF-Token':'incorrecto'})).status,403);

    const data={nombre:'Perfume del panel',marca:'Marca del panel',descripcion:'Fixture temporal',genero:'unisex',familia_olfativa:'amaderada',activo:false,
      variantes:[{presentacion:'Frasco 100 ml',tipo_presentacion:'frasco',concentracion:'EDP',volumen_ml:'100.00',precio_ref_usd:'35.50',activo:true}]};
    const createdResponse=await request('/api/admin/productos','POST',data);
    assert.equal(createdResponse.status,201);
    let product=await createdResponse.json();
    assert.equal(product.variantes[0].stock_fisico,0);
    assert.equal(product.variantes[0].precio_ref_usd,'35.50');
    const payload=p=>({...p,variantes:p.variantes.map(({stock_fisico,stock_reservado,...v})=>v)});
    assert.equal((await request('/api/admin/productos','POST',{...data,variantes:[{...data.variantes[0],stock_fisico:9}]})).status,400);
    const invalid=payload(product);invalid.nombre='No debe persistir';invalid.marca='Marca revertida';invalid.variantes[0].id='9223372036854775807';
    assert.equal((await request(`/api/admin/productos/${product.id}`,'PUT',invalid)).status,400);
    assert.equal((await json(await request(`/api/admin/productos/${product.id}`))).nombre,data.nombre);
    assert.equal((await admin.query("SELECT id FROM public.marcas WHERE nombre='Marca revertida'")).rowCount,0);
    const movement={cantidad:5,motivo:'Entrada temporal',clave:crypto.randomUUID()};
    const entryPath=`/api/admin/variantes/${product.variantes[0].id}/entradas`;
    const first=await json(await request(entryPath,'POST',movement));
    const repeat=await json(await request(entryPath,'POST',movement));
    assert.equal(first.movimiento_id,repeat.movimiento_id);
    await assert.rejects(pool.query('SELECT public.registrar_entrada_catalogo($1,$2,$3,$4,$5)', [null,5,movement.motivo,account.id,movement.clave]), {code:'23514'});
    assert.equal((await request(entryPath,'POST',{...movement,cantidad:7})).status,409);
    product=await json(await request(`/api/admin/productos/${product.id}`));
    assert.equal(product.variantes[0].stock_fisico,5);
    const snapshot=product.version;

    const png=await sharp({create:{width:12,height:12,channels:3,background:'#a5d9f3'}}).png().toBuffer();
    async function upload(bytes, route=`/api/admin/productos/${product.id}/imagen`, contentType='image/png') {
      const form=new FormData();form.append('imagen',new Blob([bytes],{type:contentType}),'foto.png');
      if (!route.endsWith('/logo')) form.append('texto_alternativo','Foto temporal del panel');
      return fetch(base+route,{method:'POST',headers:{Origin:origin,Cookie:cookie,'X-CSRF-Token':csrf},body:form});
    }
    assert.equal((await upload(Buffer.from('Esto no es imagen'))).status,400);
    assert.equal((await upload(Buffer.alloc(6*1024*1024))).status,413);
    const previousImage=await json(await upload(png));
    const image=await json(await upload(png));
    assert.equal((await request(previousImage.url)).status,404,'La foto reemplazada sin referencias se limpia');
    const filename=image.url.split('/').pop();
    assert.equal((await request(`/media/${filename}`)).status,404,'Foto de borrador privada');
    assert.equal((await request(image.url)).status,200);
    assert.equal((await fs.readdir(mediaDirectory)).length,1);
    const edited=payload(product);edited.activo=true;edited.variantes[0].precio_ref_usd='40.00';
    product=await json(await request(`/api/admin/productos/${product.id}`,'PUT',edited));
    assert.notEqual(product.version,snapshot);
    assert.equal((await request(`/api/admin/productos/${product.id}`,'PUT',edited)).status,409,'No sobreescribir edicion concurrente');
    const publicResponse=await json(await request('/api/productos?q=Perfume%20del%20panel'));
    assert.equal(publicResponse.productos.length,1);
    const published=publicResponse.productos[0];
    assert.equal(published.imagenes[0].url,`/media/${filename}`);
    assert.equal(published.variantes[0].precio_ref_usd,'40.00');
    assert.equal(published.variantes[0].disponible,true);
    assert.ok(!JSON.stringify(published).includes('stock_fisico'));
    assert.ok(!JSON.stringify(published).includes('hash_password'));
    assert.equal((await request(`/media/${filename}`)).status,200);
    const hidden=payload(product);hidden.activo=false;
    await json(await request(`/api/admin/productos/${product.id}`,'PUT',hidden));
    assert.equal((await request(`/media/${filename}`)).status,404);
    const logo=await json(await upload(png,'/api/admin/logo'));
    const store=await json(await request('/api/tienda'));
    assert.equal(store.logo_url,logo.url.replace('/api/admin',''));
    assert.equal((await request(store.logo_url)).status,200);
    const newLogo=await json(await upload(png,'/api/admin/logo'));
    assert.notEqual(newLogo.url,logo.url);
    assert.equal((await request(logo.url)).status,404);
    assert.equal((await fs.readdir(mediaDirectory)).length,2,'Solo foto vigente y logo vigente');

    assert.equal((await request('/api/admin/logout','POST')).status,204);
    assert.equal((await request('/api/admin/sesion')).status,401);
    await login();
    await admin.query("UPDATE public.sesiones_admin SET vence_en=now()-interval '1 minute' WHERE administrador_id=$1",[account.id]);
    assert.equal((await request('/api/admin/sesion')).status,401);
    await login();
    await admin.query('UPDATE public.administradores SET activo=false WHERE id=$1',[account.id]);
    assert.equal((await request('/api/admin/productos')).status,401);
    console.log('Panel: bootstrap, login/logout/caducidad, CSRF, permisos, transacciones, edicion concurrente, inventario idempotente, fotos y logo: OK');
  } finally {
    if(server) await new Promise(resolve=>server.close(resolve));
    if(pool) await pool.end();
    await admin.end();
  }
};
