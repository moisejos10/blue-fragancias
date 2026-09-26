# Estado del proyecto

Actualizado: 2026-09-25 · America/Caracas.

**Entrega actual:** BF-010 implementado y probado con PostgreSQL temporal;
pendiente aplicar `002_rol_backend.sql` y configurar la contraseña en la base
habitual del usuario. El servicio PostgreSQL 18.6 está activo; la conexión
administrativa sin contraseña fue rechazada y no se consultaron datos.

**Última entrega completada:** BF-024: `main` subida y verificada en
[moisejos10/blue-fragancias](https://github.com/moisejos10/blue-fragancias),
repositorio privado según el usuario. `origin/main` configurado como seguimiento.
BF-008 conserva el primer commit local `6235fa8`; BF-023 conserva su prueba
local exitosa del 25 de septiembre. La tienda aún no está desplegada.
[Fragancias Boutique](https://fraganciasboutique.com/) sigue como guía de tienda
(D-015). El cierre anterior se conserva en
[CIERRE-2026-09-23.md](CIERRE-2026-09-23.md).

**Punto de retorno del 25 de septiembre:** el usuario retomó BF-010 con «vamos
con postgrets». La implementación está lista. Debe abrir SQL Shell como
administrador, aplicar la nueva migración y asignar la contraseña local del rol;
después completar `backend/.env`, ejecutar `npm run db:check` y comprobar HTTP.
No compartir contraseñas en el chat. Guía: [backend/README.md](../../backend/README.md).

**Cierre resuelto:** el usuario indicó conservar `AGENTS.md` mientras se trabaja
y evitar publicarlo en GitHub. Se recuperó su copia local intacta, se añadió
`/AGENTS.md` a `.gitignore` y se cerró el merge con `e823ad7`, subido y verificado.
El archivo está ausente de `main` remota actual; permanece en commits anteriores.
No se reescribió historial. Su retirada local al finalizar queda en D-017/BF-025.

## Objetivo

Tienda catálogo de perfumes originales con React/JavaScript, Express/Node.js y
PostgreSQL. El propietario aprende por etapas. Meta orientativa: primera versión
el fin de semana del 26–27 de septiembre de 2026. Faltan confirmar horas disponibles
y si el lanzamiento será de prueba o para ventas reales; no es una fecha garantizada.

## Punto actual

La base relacional está creada y documentada. Express tiene un pool PostgreSQL,
validación de configuración y comprobación de disponibilidad. La integración
pasó en servidor temporal; la conexión a la base habitual está pendiente. Todavía
no existe frontend React ni API de catálogo.

| Área | Estado | Evidencia y alcance |
|---|---|---|
| Herramientas locales | Confirmado por el usuario | Capturas: Node 22.22.2, npm 10.9.7, Git 2.53.0.windows.2 y PostgreSQL 18.6 |
| Conexión local a PostgreSQL | Confirmado por el usuario | Sesión `psql`, consulta de base/usuario/versión satisfactoria |
| Esquema relacional | Implementado | `backend/database/001_esquema_inicial.sql`: 11 tablas y 16 FK |
| Instalación del esquema en su base | Confirmado por el usuario | Salida de `instalar.sql` con `COMMIT` y lista paginada de tablas; no se volvió a entrar a su servidor desde el agente |
| Pruebas del esquema e integración | Probado localmente el 2026-09-25 | Nueva ejecución de `test-schema.cjs`, código 0: rol autenticado y permisos, HTTP 200/503, 73 comprobaciones SQL, instalación, reejecución, subtotal al COMMIT y dos conexiones por la última unidad |
| Reproducibilidad actual de pruebas SQL | Restablecida; BF-023 terminado | `backend/database/pruebas.sql` reconstruido. El sandbox impidió iniciar `pg_ctl`; la ejecución autorizada fuera del sandbox terminó correctamente usando servidor temporal independiente |
| Backend y pool SQL | Implementado; probado en entorno temporal | `pg` ^8.23.0, pool máximo 5, configuración validada, cierre de conexiones; `/api/health` y `/api/health/db` (200/503 sin datos privados). `npm test`: 7 pruebas aprobadas |
| Rol y conexión habitual | Pendiente de completar por el usuario | `002_rol_backend.sql` probado: crea `blue_fragancias_app` nuevo, lectura de 4 tablas de catálogo y rechazo de privilegios inesperados. `.env` local preparado e ignorado; `db:check` detuvo la ejecución porque falta PGPASSWORD. No se aplicó el rol a la base habitual |
| Documentación visual | Implementada y verificada parcialmente | HTML/SVG/PNG y guía en `documentacion`; 11 tablas, 16 FK y 110 campos comprobados, imagen PNG revisada visualmente |
| Interacción del HTML | Pendiente de prueba en navegador | La herramienta bloqueó `file://`; se validó sintaxis JavaScript y se inspeccionó el SVG rasterizado, no la interacción del navegador |
| Git del proyecto | Implementado y comprobado localmente | Rama `main`, primer commit `6235fa8` con 22 archivos; `.env`, dependencias, logs y `.tmp` excluidos. Identidad Git existente utilizada; primer commit verificado con árbol limpio |
| GitHub | Sincronizado, verificado y confirmado por el usuario el 2026-09-25 | `origin` apunta al repositorio existente aportado por el usuario. Push sin force, seguimiento `origin/main` y SHA local/remoto coincidente. Privacidad indicada por el usuario; no se cambió la visibilidad. Git Credential Manager permitió autenticar sin instalar plugin ni `gh` |
| Coordinación persistente | Perfil, memoria e instrucciones locales presentes | `AGENTS.md` local excluido de Git (D-017); comandos de pruebas actualizados para BF-010. Archivo ausente del árbol remoto actual, conservado en historial antiguo. Perfil `.codex/agents/coordinador_blue.toml` disponible |
| Referencia de tienda | Aportada por el usuario; diseño pendiente | Fragancias Boutique (D-015): contenido de inicio y colección consultado por web. Navegador visual no disponible; apariencia e interacciones no comprobadas |

Corrección posterior a la recapitulación del 25 de septiembre: se reconstruyó
`backend/database/pruebas.sql` y se ejecutó la suite sobre un servidor temporal.
Posteriormente se completó Git local (H-015) y la subida a GitHub (H-016);
frontend continúa pendiente.
No se modificó la migración instalada ni se consultaron datos de la base habitual
del usuario. La nueva prueba de Express y del rol se realizó en PostgreSQL
temporal y se registra en H-019; los antecedentes se conservan en H-013 a H-018.

## Todavía no implementado

- Aplicación del rol limitado y configuración de contraseña en la base habitual;
  código y migración ya implementados y probados en PostgreSQL temporal.
- API del catálogo, administración, autenticación y autorización.
- Fuente de tasa EUR/VES, estrategia de fallos y validación de vigencia.
- Frontend, filtros, imágenes reales y carrito.
- Creación de pedidos desde la API y enlace de WhatsApp.
- Flujo de confirmación, conciliación de pagos y vencimiento/liberación de reservas.
- Despliegue, dominio, HTTPS, respaldos y prueba de restauración.

## Próxima entrega propuesta

**Completar BF-010 en la base habitual.** Aplicar `002_rol_backend.sql` desde
la sesión administradora del usuario; asignar contraseña con `\password`,
completar `.env` y verificar `npm run db:check` y `/api/health/db`.
El rol inicial solo lee catálogo; pedidos, pagos y escritura de inventario esperan
entregas posteriores. Después sigue BF-011 (API de catálogo).

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
  Requiere `npm ci` en backend en copias nuevas. Última ejecución ampliada:
  2026-09-25, código 0, fuera del sandbox con autorización.
- Diagramas: `node documentacion/generar-diagrama.cjs` (HTML y SVG, no PNG).
- Backend: `npm test` desde `backend`: 7 pruebas aprobadas el 2026-09-25.
- Conexión habitual: `npm run db:check` desde `backend`, pendiente completar
  PGPASSWORD y crear el rol. `npm run dev` carga el `.env` privado y sirve las dos
  rutas de estado. No afirmar conexión habitual hasta comprobarla.
