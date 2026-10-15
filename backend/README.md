# Backend de Blue Fragancias

Express recibe las peticiones de la pagina y consulta PostgreSQL mediante `pg`.
El pool reutiliza hasta cinco conexiones. Incluye comprobaciones de disponibilidad
y la ruta de lectura del catalogo con busqueda y filtros (BF-011).

## 1. Crear el usuario de la aplicacion

Requiere el esquema inicial ya instalado en `blue_fragancias`. En **SQL Shell
(psql)**, conectado como administrador `postgres`, ejecutar una vez:

```text
\connect blue_fragancias
\i 'C:/Users/Moise/Documents/PROGRAMACION/Blue Fragancias/backend/database/002_rol_backend.sql'
\password blue_fragancias_app
```

El ultimo comando pide dos veces una contraseña, sin mostrarla. Elegir una
contraseña exclusiva para la aplicacion y escribirla solo en el equipo; no
compartirla en el chat. `postgres` sirve para esta preparacion administrativa;
el backend usa `blue_fragancias_app`.

El script crea un rol nuevo con lectura en `marcas`, `productos`,
`variantes_producto` e `imagenes_producto`. No otorga escrituras en las tablas
de la tienda ni lectura de administradores, pedidos, tasas o pagos. Se ejecuta
en una transaccion y no modifica datos ni la migracion inicial.

Si el nombre del rol ya existe, el script se detiene sin cambiar su contraseña
o sus permisos. No eliminarlo para repetir el paso: primero revisar la salida
y comprobar si ya se configuro. Tampoco volver a ejecutar `instalar.sql` sobre
la base existente.

## 2. Configurar la conexion privada

El archivo `backend/.env` esta excluido de Git. Se preparo una copia local de
`.env.example`; si trabajas desde una descarga nueva, copiala primero:

```powershell
Copy-Item .env.example .env
```

Ejecutar esa copia desde `backend` solo si `.env` no existe. En `.env`, completar
`PGPASSWORD` con la misma contraseña asignada en SQL Shell; puedes escribirla
entre comillas dobles. Mantener `PGUSER=blue_fragancias_app`. La plantilla supone
PostgreSQL local en `127.0.0.1:5432` y la base `blue_fragancias`.

Node 22 carga este archivo al usar los comandos siguientes. Las variables ya
definidas en la terminal tienen prioridad sobre `.env`; revisar esa terminal si
la comprobacion usa una configuracion diferente de la esperada.

## 3. Comprobar y arrancar

Desde `backend`:

```text
npm run db:check
npm run dev
```

La primera orden confirma usuario, base y lectura de las cuatro tablas sin
imprimir credenciales ni filas. La segunda inicia Express; se detiene con Ctrl+C.

| Direccion local | Resultado esperado |
|---|---|
| `http://localhost:3000/api/health` | Estado del servidor HTTP |
| `http://localhost:3000/api/health/db` | HTTP 200 y `{"status":"ok"}` si puede consultar productos, incluso sin productos cargados |

Si la conexion o los permisos fallan, la segunda ruta responde HTTP 503 con
`{"status":"unavailable"}`. No muestra SQL, stack, contraseñas ni datos del cliente.

## Catalogo: GET /api/productos

Con el backend iniciado, abrir `http://localhost:3000/api/productos`.
Sin productos publicados, la respuesta es:

```json
{"productos":[],"paginacion":{"pagina":1,"limite":20,"hay_mas":false}}
```

Ejemplo de paginacion: `/api/productos?pagina=2&limite=10`.
`pagina` admite enteros de 1 a 10000 y `limite` de 1 a 50; por defecto, 1 y 20.
La busqueda `q` busca coincidencias parciales en nombre, descripcion, familia
olfativa y marca. `marca` filtra por nombre exacto, sin distinguir mayusculas.
`genero` admite `femenino`, `masculino` o `unisex`; `tipo` admite `frasco`,
`decant` o `muestra` y exige que el producto tenga una variante activa de ese tipo.
La respuesta conserva todas las variantes activas del producto, incluso al filtrar
por tipo. `q` y `marca` admiten hasta 100 caracteres despues de quitar espacios
externos. La busqueda no distingue mayusculas, pero conserva los acentos; los
caracteres `%`, `_`, `!` y la barra inversa se buscan literalmente.
Por ejemplo: `/api/productos?q=bleu&genero=masculino&tipo=frasco`.
Cada filtro se admite una sola vez; textos vacios, demasiado largos, valores
fuera de las opciones, parametros duplicados o desconocidos responden HTTP 400.
El orden es por ID ascendente; `hay_mas` indica si existe una pagina siguiente
en esa consulta. La paginacion se aplica despues de los filtros. Cambios en el
catalogo entre consultas pueden mover resultados.

Solo devuelve productos activos y sus variantes activas. Un producto activo sin
variantes activas devuelve `variantes: []`; uno sin imagenes, `imagenes: []`.
Cada producto incluye nombre, slug, descripcion, genero, familia olfativa, marca,
variantes e imagenes ordenadas. Las variantes incluyen presentacion, tipo,
concentracion, volumen, precio de referencia USD y disponibilidad (stock fisico
menos reservado mayor que cero), sin publicar saldos internos de inventario.
La disponibilidad es informativa: no reserva unidades ni garantiza un pedido.

Los IDs, precios y volumenes viajan como texto para conservar precision.
No calcula bolivares ni inventa tasas. `clave_archivo` identifica la imagen;
`url` contiene una ruta controlada `/media/…` para las fotos subidas por el panel,
o null si la clave no pertenece al almacenamiento implementado. No incluye datos de
clientes, pagos o administradores. Ante fallo SQL devuelve HTTP 503 generico.

## Panel de administración

Implementado acceso privado y gestión de catálogo en `/api/admin`, con pantalla
React en `/admin`. Preparación de la base habitual pendiente: aplicar una sola
vez `003_administracion_catalogo.sql` y crear la cuenta mediante los comandos
locales descritos en [la guía del panel](../documentacion/PANEL-ADMINISTRACION.md).

003 concede escritura de columnas comerciales del catálogo, sesiones y logo;
mantiene los saldos sin INSERT/UPDATE directo desde el rol app. Las entradas se
registran por una función acotada con rol técnico NOLOGIN y clave idempotente.
El permiso de crear el primer administrador se revoca al crearlo correctamente.
Las contraseñas usan Argon2id; sesiones de 8 horas con token hash en PostgreSQL,
cookie HttpOnly/SameSite, comprobación de origen y token CSRF para escrituras.

Las subidas se autentican antes de leer el archivo, limitan tamaño y dimensiones,
decodifican JPG/PNG/WebP y reexportan WebP sin metadatos. Las fotos de borradores
son privadas; `/media` consulta publicación antes de servirlas. Portadas y logos
reemplazados sin referencias se limpian después del COMMIT. El almacenamiento
local ignorado por Git necesita respaldo y persistencia para desplegar.

## Pruebas

```text
npm test
npm run test:db
```

- `npm test`: pruebas de configuracion y respuestas HTTP, sin usar la base.
- `npm run test:db`: servidor PostgreSQL temporal independiente. Incluye el
  esquema, las 73 comprobaciones SQL anteriores, concurrencia, el nuevo rol,
  denegacion de accesos y Express con conexiones reales. El catalogo se prueba
  con fixtures dentro de una transaccion temporal que se revierte, sin cargar
  productos en la base habitual. Puede requerir permiso
  para iniciar el proceso temporal en un entorno restringido.
  La suite añade 003 y prueba el panel con otros fixtures temporales después de
  las verificaciones originales. Nunca carga esos datos en la base habitual.

## Alcance de los permisos

El rol no es propietario ni administrador y no recibe permisos automaticos
para tablas futuras. El script rechaza concesiones inesperadas de `PUBLIC` que
permitan crear objetos persistentes, escribir en tablas o leer datos privados.
No cambia permisos de otros usuarios ni otras bases.

PostgreSQL conserva sus permisos generales de `PUBLIC`, como tablas temporales
de sesion y posibles conexiones a otras bases del mismo servidor. Por eso esta
entrega limita las **tablas de la tienda**; no pretende aislar todo el servidor.
Los permisos de pedidos y pagos siguen pendientes. 003 añade administración de
catálogo y entradas positivas de inventario, sin escrituras directas sobre saldos.

El despliegue remoto y su configuracion TLS quedan en BF-020. Esta configuracion
esta preparada para desarrollo local.

Referencias tecnicas: [pool de node-postgres](https://node-postgres.com/features/pooling),
[roles de PostgreSQL 18](https://www.postgresql.org/docs/18/sql-createrole.html)
y [privilegios de PostgreSQL](https://www.postgresql.org/docs/18/ddl-priv.html).
