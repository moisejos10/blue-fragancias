# Estado del proyecto

Actualizado: 2026-10-15 · America/Caracas.

**Entrega actual:** administración local del catálogo (BF-014 + BF-015), en revisión.
Panel gráfico implementado y probado nuevamente en PostgreSQL temporal el 15 de octubre:
acceso, productos, presentaciones/precios, foto de portada, logo, publicación y
entradas de inventario. Migración 003 detectada en la base habitual y primera
cuenta creada el 1 de octubre; login, sesión y logout comprobados por HTTP (H-031).
BF-013 continúa parcial, ahora con tres imágenes provisionales autorizadas (D-019).
Verificación nueva del 15 de octubre: 12/12 pruebas de backend, compilación,
db:check habitual, suite SQL temporal y 28 comprobaciones HTTP aprobadas (H-033).
Revisión interactiva pendiente: Chrome no disponible en la herramienta de
navegación; el control de ventanas se detuvo en el intento anterior al no poder
identificar la URL. Véase [informe de verificación](VERIFICACION-2026-10-15.md).
Carpeta de recepción de recursos creada: [imagenes-tienda](../../imagenes-tienda/README.md),
con logos, perfumes, banners y referencias; pendiente de archivos del usuario (H-028).

**Última entrega completada:** BF-011, catálogo con filtros/búsqueda, probado el
1 de octubre con 11 pruebas HTTP/configuración y suite PostgreSQL temporal.
Se corrigió la búsqueda literal de comodines. Frontend y catálogo permanecen
locales, pendientes de sincronización; la tienda no está desplegada.
Fragancias Boutique sigue como guía de tienda (D-015).

**Punto de retorno:** abrir http://127.0.0.1:5173 para ver la tienda y `/admin` para
el acceso al panel. Activación habitual comprobada en H-031: 003 presente y
cuenta solicitada creada. Entrar con las credenciales elegidas por el propietario;
no repetir los comandos iniciales. Véase la [guía del panel](../PANEL-ADMINISTRACION.md).
Backend y Vite iniciados el 15 de octubre y comprobados por HTTP en 3000/5173;
su disponibilidad posterior depende de los procesos locales. Para reiniciarlos,
en dos terminales:
`npm --prefix backend run dev` y `npm --prefix frontend run dev`.
No repetir migraciones ni reasignar contraseñas. Guías:
[frontend](../../frontend/README.md) y [backend](../../backend/README.md).
El usuario confirmó «listo» tras la guía de pgAdmin y pidió continuar.
La captura muestra las 11 tablas; el ERD quedó confirmado por el usuario,
no inspeccionado directamente por el agente (H-024).

**Cierre resuelto:** el usuario indicó conservar `AGENTS.md` mientras se trabaja
y evitar publicarlo en GitHub. Se recuperó su copia local intacta, se añadió
`/AGENTS.md` a `.gitignore` y se cerró el merge con `e823ad7`, subido y verificado.
El archivo está ausente de `main` remota actual; permanece en commits anteriores.
No se reescribió historial. Su retirada local al finalizar queda en D-017/BF-025.

## Objetivo

Tienda catálogo de perfumes originales con React/JavaScript, Express/Node.js y
PostgreSQL. El propietario aprende por etapas. Meta orientativa: primera versión
el fin de semana del 26–27 de septiembre de 2026, ya transcurrido. Falta acordar
nueva fecha, horas disponibles y si el lanzamiento será demo o ventas reales.

## Punto actual

La base relacional está creada y documentada. Express tiene un pool PostgreSQL,
validación de configuración y comprobación de disponibilidad. La integración
pasó en servidor temporal y en la base habitual (H-022). El listado de catálogo
está implementado y probado, incluidos filtros (H-026). La pantalla React tiene
referencias provisionales (H-029) y el panel administrativo está implementado
y probado en base temporal (H-030); revisión visual/interactiva pendiente.

| Área | Estado | Evidencia y alcance |
|---|---|---|
| Herramientas locales | Confirmado por el usuario | Capturas: Node 22.22.2, npm 10.9.7, Git 2.53.0.windows.2 y PostgreSQL 18.6 |
| Conexión local a PostgreSQL | Confirmado por el usuario | Sesión `psql`, consulta de base/usuario/versión satisfactoria |
| Esquema relacional | Implementado | `backend/database/001_esquema_inicial.sql`: 11 tablas y 16 FK |
| Ampliación administrativa 003 | Probada en base temporal; activación habitual comprobada | Tablas y función de creación presentes en base habitual en H-031; primera cuenta creada y login/sesión/logout HTTP aprobados. No se volvió a ejecutar la migración |
| Instalación del esquema en su base | Confirmado por el usuario | Salida de `instalar.sql` con `COMMIT` y lista paginada de tablas; conexión posterior del backend comprobada en H-022 |
| Pruebas del esquema e integración | Probado localmente el 2026-10-15 | `test-schema.cjs`, código 0: esquema y 003/panel, acceso, CSRF, permisos, rollback, edición concurrente, inventario idempotente, fotos privadas/publicadas, reemplazo y limpieza, logo y revocación de sesión. Servidor temporal detenido y limpiado |
| Reproducibilidad actual de pruebas SQL | Restablecida; BF-023 terminado | `backend/database/pruebas.sql` reconstruido. El sandbox impidió iniciar `pg_ctl`; la ejecución autorizada fuera del sandbox terminó correctamente usando servidor temporal independiente |
| Backend y pool SQL | Implementado; catálogo y acceso administrativo habitual comprobados | Pool máximo 5; `npm test`: 12/12 aprobadas el 15 de octubre. Login/sesión/logout habitual conserva evidencia histórica H-031; no se repitió con la cuenta real |
| API de catálogo | BF-011 terminado localmente | GET /api/productos admite q, marca, genero y tipo además de paginación. Suite temporal aprobada el 15 de octubre. Lectura habitual por proxy HTTP 200 con lista vacía; sin cargar productos |
| Frontend | BF-013 parcial, implementado y compilado | React/Vite; paleta D-018 y referencias D-019; tienda y /admin. Build aprobado el 15 de octubre; HTML, módulos, CSS e imágenes HTTP 200. Apariencia e interacciones pendientes de navegador; producto y fotos reales pendientes |
| Administración del catálogo | BF-014/015 en revisión | Panel gráfico D-020, Argon2id, sesiones de 8 horas, Origin+CSRF, formularios y entradas positivas. Probado con fixtures temporales; cuenta habitual creada y acceso HTTP comprobado (H-031). Pendiente revisión interactiva. Guía documentacion/PANEL-ADMINISTRACION.md |
| Rol y conexión habitual | Comprobado nuevamente el 2026-10-15 (H-033) | db:check código 0: rol limitado y lectura de 4 tablas del catálogo; health y health/db 200 a través de Vite. Configuración privada local, sin imprimir secretos |
| Documentación visual | Implementada y verificada parcialmente | HTML/SVG/PNG y guía en `documentacion`: esquema inicial de 11 tablas, 16 FK y 110 campos; PNG revisado históricamente. No incorpora las dos tablas añadidas por 003 |
| Interacción del HTML | Pendiente de prueba en navegador | La herramienta bloqueó `file://`; se validó sintaxis JavaScript y se inspeccionó el SVG rasterizado, no la interacción del navegador |
| Git del proyecto | Implementado y comprobado localmente | Rama `main`, primer commit `6235fa8` con 22 archivos; `.env`, dependencias, logs y `.tmp` excluidos. Identidad Git existente utilizada; primer commit verificado con árbol limpio |
| GitHub | Sincronizado, verificado y confirmado por el usuario el 2026-09-25 | `origin` apunta al repositorio existente aportado por el usuario. Push sin force, seguimiento `origin/main` y SHA local/remoto coincidente. Privacidad indicada por el usuario; no se cambió la visibilidad. Git Credential Manager permitió autenticar sin instalar plugin ni `gh` |
| Coordinación persistente | Perfil, memoria e instrucciones locales presentes | `AGENTS.md` local excluido de Git (D-017); comandos de pruebas actualizados para BF-010. Archivo ausente del árbol remoto actual, conservado en historial antiguo. Perfil `.codex/agents/coordinador_blue.toml` disponible |
| Referencia de tienda | Aportada por el usuario; diseño pendiente | Fragancias Boutique (D-015): contenido de inicio y colección consultado por web. Navegador visual no disponible; apariencia e interacciones no comprobadas |

Corrección posterior a la recapitulación del 25 de septiembre: se reconstruyó
`backend/database/pruebas.sql` y se ejecutó la suite sobre un servidor temporal.
Posteriormente se completó Git local (H-015) y la subida a GitHub (H-016);
frontend comenzó posteriormente en H-027.
La migración 001 permanece intacta. H-019 registra pruebas temporales; H-020,
la aplicación de 002; H-021, la contraseña; H-022, las consultas de lectura y
ambas rutas HTTP comprobadas contra la base habitual.

## Todavía no implementado

- Revisión interactiva del panel y primer producto en base habitual.
  Código, pruebas temporales y acceso habitual comprobados; recuperación de contraseña y
  cuentas adicionales pendientes.
- Fuente de tasa EUR/VES, estrategia de fallos y validación de vigencia.
- Ficha completa de producto, imágenes reales y carrito; revisión visual pendiente
  para la base React ya implementada.
- Creación de pedidos desde la API y enlace de WhatsApp.
- Flujo de confirmación, conciliación de pagos y vencimiento/liberación de reservas.
- Despliegue, dominio, HTTPS, respaldos y prueba de restauración.

## Próxima entrega propuesta

**Revisar BF-014/015** ya activado y comprobar el primer
producto desde sus formularios. Después completar BF-013 con datos reales y
revisión escritorio/móvil. Precios en Bs y fuente EUR/VES siguen en BF-012.

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
- Las fotos subidas quedan en backend/storage/imagenes (ignorada por Git):
  respaldar y usar almacenamiento persistente antes de desplegar. HTTPS,
  ADMIN_ORIGINS y limitador compartido si hay varias instancias quedan en BF-020.
- Fecha original transcurrida; acordar horas y alcance antes de fijar otra fecha.

## Comprobaciones disponibles

- SQL: `node backend/database/test-schema.cjs` (servidor temporal; permisos según entorno).
  Requiere `npm ci` en backend en copias nuevas. Última ejecución ampliada:
  2026-10-15, código 0, fuera del sandbox tras fallo de pg_ctl dentro (errores 87/3).
  Clúster temporal detenido y eliminado; cero directorios postgres-schema-* restantes.
- Diagramas: `node documentacion/generar-diagrama.cjs` (HTML y SVG, no PNG).
- Backend: `npm test` desde `backend`: 12/12 aprobadas el 2026-10-15.
- Frontend: `npm --prefix frontend run build` aprobado el 2026-10-15.
- HTTP: 28 comprobaciones aprobadas el 15 de octubre por proxy Vite: HTML,
  módulos/CSS, tres imágenes, health/db, configuración y catálogo 200;
  parámetros inválidos 400, accesos/escritura anónimos 401, origen externo 403
  e imagen inexistente 404. Sin revisión visual.
- Catálogo habitual: HTTP 200 con filtros; productos=[], pagina=1, limite=12,
  hay_mas=false. Sin escrituras exitosas ni datos ficticios en la base habitual.
- Conexión habitual: `npm --prefix backend run db:check` aprobado el 2026-10-15.
  Backend y Vite responden localmente; `npm run dev` en backend utiliza el `.env`
  privado sin mostrarlo. Detalles en H-033 y el informe de verificación.
