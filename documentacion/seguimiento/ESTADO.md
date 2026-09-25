# Estado del proyecto

Actualizado: 2026-09-25 · America/Caracas.

**Última entrega:** BF-023 completado a petición del usuario: `pruebas.sql`
reconstruido y suite completa probada localmente el 25 de septiembre.
[Fragancias Boutique](https://fraganciasboutique.com/) sigue como guía de tienda
(D-015). El cierre anterior se conserva en
[CIERRE-2026-09-23.md](CIERRE-2026-09-23.md).

## Objetivo

Tienda catálogo de perfumes originales con React/JavaScript, Express/Node.js y
PostgreSQL. El propietario aprende por etapas. Meta orientativa: primera versión
el fin de semana del 26–27 de septiembre de 2026. Faltan confirmar horas disponibles
y si el lanzamiento será de prueba o para ventas reales; no es una fecha garantizada.

## Punto actual

La base relacional está creada y documentada. Existe un servidor Express básico;
todavía no está conectado a PostgreSQL ni existe frontend React.

| Área | Estado | Evidencia y alcance |
|---|---|---|
| Herramientas locales | Confirmado por el usuario | Capturas: Node 22.22.2, npm 10.9.7, Git 2.53.0.windows.2 y PostgreSQL 18.6 |
| Conexión local a PostgreSQL | Confirmado por el usuario | Sesión `psql`, consulta de base/usuario/versión satisfactoria |
| Esquema relacional | Implementado | `backend/database/001_esquema_inicial.sql`: 11 tablas y 16 FK |
| Instalación del esquema en su base | Confirmado por el usuario | Salida de `instalar.sql` con `COMMIT` y lista paginada de tablas; no se volvió a entrar a su servidor desde el agente |
| Pruebas del esquema | Probado localmente el 2026-09-25 | `node backend/database/test-schema.cjs` terminó con código 0 en PostgreSQL 18 temporal: 73 comprobaciones SQL, instalación, reejecución, subtotal al COMMIT y dos conexiones por la última unidad |
| Reproducibilidad actual de pruebas SQL | Restablecida; BF-023 terminado | `backend/database/pruebas.sql` reconstruido. El sandbox impidió iniciar `pg_ctl`; la ejecución autorizada fuera del sandbox terminó correctamente usando servidor temporal independiente |
| Backend básico | Implementado; runtime no verificado en esta revisión | `backend/src/server.js`: JSON y `GET /api/health`; Express ^5.2.1 en `package.json` |
| Documentación visual | Implementada y verificada parcialmente | HTML/SVG/PNG y guía en `documentacion`; 11 tablas, 16 FK y 110 campos comprobados, imagen PNG revisada visualmente |
| Interacción del HTML | Pendiente de prueba en navegador | La herramienta bloqueó `file://`; se validó sintaxis JavaScript y se inspeccionó el SVG rasterizado, no la interacción del navegador |
| Git del proyecto | Pendiente | Git instalado, pero no se encontró `.git` en la raíz durante la revisión |
| Coordinación persistente | Configurada y revisada | Perfil `.codex/agents/coordinador_blue.toml` instalado y validado como TOML; AGENTS.md y memoria presentes. El perfil `coordinador_blue` estuvo disponible y se invocó para la revisión acotada del 25 de septiembre |
| Referencia de tienda | Aportada por el usuario; diseño pendiente | Fragancias Boutique (D-015): contenido de inicio y colección consultado por web. Navegador visual no disponible; apariencia e interacciones no comprobadas |

Corrección posterior a la recapitulación del 25 de septiembre: se reconstruyó
`backend/database/pruebas.sql` y se ejecutó la suite sobre un servidor temporal.
Siguen pendientes Git y frontend. No se modificó la migración instalada ni se
consultó la base habitual del usuario; el runtime de Express sigue sin verificarse
en esta revisión. Los antecedentes se conservan en H-013 y la nueva prueba en H-014.

## Todavía no implementado

- Rol PostgreSQL limitado, configuración privada y conexión del backend mediante pool.
- API del catálogo, administración, autenticación y autorización.
- Fuente de tasa EUR/VES, estrategia de fallos y validación de vigencia.
- Frontend, filtros, imágenes reales y carrito.
- Creación de pedidos desde la API y enlace de WhatsApp.
- Flujo de confirmación, conciliación de pagos y vencimiento/liberación de reservas.
- Despliegue, dominio, HTTPS, respaldos y prueba de restauración.

## Próxima entrega propuesta

**BF-010: conectar Express a PostgreSQL con un rol de permisos limitados.**
Antes: comprender producto/presentación y establecer el repositorio Git (BF-008).
La reproducibilidad de las pruebas quedó resuelta con BF-023. La entrega
debe terminar con una consulta controlada desde el backend, sin contraseña en el
código ni uso de `postgres` en la aplicación. No se inicia automáticamente por
crear el coordinador.

## Riesgos y decisiones que afectan el lanzamiento

- Fuente de tasa sin validar. Una API de terceros no debe presentarse como API oficial del BCV.
- La suite SQL usa PostgreSQL temporal y puede requerir autorización fuera del
  sandbox para iniciar `pg_ctl`; no usar la base habitual para sortear ese límite.
- `reserva_hasta` es un dato; todavía no hay tarea que libere reservas vencidas.
- El esquema tiene controles, pero la API debe añadir permisos, validación,
  transiciones y conciliación. Tener tablas no significa tener una tienda segura publicada.
- Presupuesto, proveedor de hosting, dominio, productos reales, fotos y número comercial
  de WhatsApp pendientes. No guardar credenciales o datos privados en esta memoria.
- Alcance de frascos/decants/muestras y reglas para pago en efectivo por definir.
- Horas de trabajo no confirmadas: revisar el alcance antes de comprometer el domingo.

## Comprobaciones disponibles

- SQL: `node backend/database/test-schema.cjs` (servidor temporal; permisos según entorno).
  Última ejecución completa: 2026-09-25, código 0, fuera del sandbox con autorización.
- Diagramas: `node documentacion/generar-diagrama.cjs` (HTML y SVG, no PNG).
- Backend: `npm run dev` desde `backend`, luego comprobar `GET /api/health` cuando corresponda.
- `npm test` del backend todavía es un marcador de ejemplo, no una suite útil.
