# Backend de Blue Fragancias

Express recibe las peticiones de la pagina y consulta PostgreSQL mediante `pg`.
El pool reutiliza hasta cinco conexiones. Esta entrega prepara la conexion y
comprueba disponibilidad; la API del catalogo se construira en BF-011.

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

## Pruebas

```text
npm test
npm run test:db
```

- `npm test`: siete pruebas de configuracion y respuestas HTTP, sin usar la base.
- `npm run test:db`: servidor PostgreSQL temporal independiente. Incluye el
  esquema, las 73 comprobaciones SQL anteriores, concurrencia, el nuevo rol,
  denegacion de accesos y Express con conexiones reales. Puede requerir permiso
  para iniciar el proceso temporal en un entorno restringido.

## Alcance de los permisos

El rol no es propietario ni administrador y no recibe permisos automaticos
para tablas futuras. El script rechaza concesiones inesperadas de `PUBLIC` que
permitan crear objetos persistentes, escribir en tablas o leer datos privados.
No cambia permisos de otros usuarios ni otras bases.

PostgreSQL conserva sus permisos generales de `PUBLIC`, como tablas temporales
de sesion y posibles conexiones a otras bases del mismo servidor. Por eso esta
entrega limita las **tablas de la tienda**; no pretende aislar todo el servidor.
Los permisos de pedidos, pagos e inventario se añadiran en entregas posteriores
mediante migraciones nuevas, sin permitir escrituras directas sobre saldos.

El despliegue remoto y su configuracion TLS quedan en BF-020. Esta configuracion
esta preparada para desarrollo local.

Referencias tecnicas: [pool de node-postgres](https://node-postgres.com/features/pooling),
[roles de PostgreSQL 18](https://www.postgresql.org/docs/18/sql-createrole.html)
y [privilegios de PostgreSQL](https://www.postgresql.org/docs/18/ddl-priv.html).
