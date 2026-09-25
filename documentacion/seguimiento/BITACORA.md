# Bitácora de Blue Fragancias

Las entradas iniciales reconstruyen la conversación al 2026-09-23. No se conocen
las horas exactas de todos los pasos anteriores; su orden se conserva sin inventar
marcas de tiempo. Las comprobaciones históricas no se presentan como ejecutadas hoy
de nuevo. Añadir las próximas entradas al final.

## H-001 · Inicio y requisitos · Reconstrucción inicial

- Usuario: tienda de perfumes originales, catálogo filtrable, fotos, administración
  sencilla, stock, pedidos y pagos. Quiere aprender paso a paso hasta producción.
- Stack: React/JavaScript, Node.js/Express y SQL; se eligió PostgreSQL.
- Resultado: alcance inicial conversado. Catálogo concreto y material visual pendientes.

## H-002 · Precios, invitados, entregas y pagos · Reconstrucción inicial

- Confirmado: referencia USD multiplicada por tasa EUR/VES para el importe Bs.
- Confirmado: envío nacional, delivery y pickup; compra invitada con pedido guardado
  antes de abrir WhatsApp; Pago Móvil, Binance Pay y efectivo.
- Aclarado: abrir WhatsApp prepara un mensaje y no acredita un pago.
- Pendiente: fuente API fiable, reglas de reservas, costos de entrega y conciliación.

## H-003 · Entorno y primera consulta · Reconstrucción inicial

- Evidencia del usuario: Node 22.22.2, npm 10.9.7, Git 2.53.0.windows.2.
- Se instaló PostgreSQL 18.6; Stack Builder no era necesario para esta etapa.
- El usuario logró conectarse con psql y ejecutó
  `SELECT current_database(), current_user, version();` satisfactoriamente.
- Se observó advertencia de codificación de la consola Windows. No impidió conectar;
  no se registró una corrección definitiva de esa configuración.

## H-004 · Organización por entregas · Reconstrucción inicial

- El usuario pidió un plan práctico antes de seguir y fijó el fin de semana como meta.
- Se propuso Kanban y una primera versión acotada, con pagos de revisión manual.
- Horas diarias disponibles y lanzamiento de prueba o real quedaron sin respuesta.

## H-005 · Backend básico encontrado · Reconstrucción inicial

- Archivos: `backend/package.json` y `backend/src/server.js`.
- Express ^5.2.1, servidor en puerto 3000, middleware JSON y GET `/api/health`.
- No se encontró conexión a PostgreSQL, otras rutas ni frontend. La presencia del
  código no prueba que el proceso esté ejecutándose actualmente.

## H-006 · Esquema y pruebas · Reconstrucción inicial

- A petición del usuario se crearon `backend/database/001_esquema_inicial.sql`,
  `instalar.sql`, `pruebas.sql`, `test-schema.cjs`, su guía y `.gitignore`.
- Resultado: 11 tablas, 16 FK, snapshots de precios, tasas inmutables, validaciones
  de pagos, movimientos atómicos y comprobación diferida del subtotal.
- La revisión detectó reservas ajenas y devoluciones sin venta; se corrigieron
  antes de entregar el esquema y se añadieron pruebas de esos casos.
- Un arranque temporal falló por manejo de procesos/pipes de Windows; se corrigió,
  se detuvo el servidor temporal y se limpió su carpeta. No se usó la contraseña
  de la base habitual del usuario.
- Última prueba reportada en la conversación: salida exitosa de
  `node backend/database/test-schema.cjs`, incluidas dos conexiones compitiendo
  por una última unidad y rechazo de subtotal incorrecto al COMMIT.

## H-007 · Instalación local confirmada por el usuario · Reconstrucción inicial

- El usuario ejecutó `instalar.sql` en su sesión psql.
- Compartió salida con CREATE TABLE/INDEX/FUNCTION/TRIGGER, COMMIT y listado
  de tablas paginado. Se confirmó instalación completada según esa evidencia.
- Se explicó cómo desactivar el paginador y consultar la estructura de una tabla.
- No se volvió a conectar a la base del usuario ni se inspeccionaron sus datos.

## H-008 · Documentación gráfica · Reconstrucción inicial

- A petición del usuario se creó `documentacion` con guía, generador, HTML, SVG y PNG.
- Alcance comprobado: 11 tablas, 16 relaciones y 110 campos; sintaxis JavaScript
  y XML válidas. PNG exportado e inspeccionado visualmente.
- Límite: la herramienta de navegador rechazó la URL local `file://`; no se
  comprobó interactividad en navegador ni se eludió el bloqueo. La verificación
  de HTML en navegador queda pendiente como BF-009.

## H-009 · Coordinador persistente · 2026-09-23

- Petición: agente que organice, supervise y recuerde cada paso del proyecto.
- Se consultó documentación oficial de agentes personalizados y AGENTS.md.
- Se prepararon el perfil `coordinador_blue`, instrucciones de proyecto y esta
  memoria con estado, tablero y decisiones, sin secretos ni datos de clientes.
- Instalación del perfil y revisión de consistencia: en curso; registrar el
  resultado en una entrada posterior, sin asumir carga automática de la app.

## H-010 · Primera revisión de coordinación · 2026-09-23

- Revisión independiente, solo lectura, de backend, base y documentación.
- Hallazgo: `backend/database/pruebas.sql` ya no está en los archivos actuales,
  aunque fue creado y utilizado en las pruebas históricas de H-006. El ejecutor
  `test-schema.cjs` todavía lo referencia. Causa de la ausencia no determinada.
- Verificación: búsqueda de archivos y `Test-Path` con resultado falso; no se
  ejecutaron tests ni se conectó al servidor PostgreSQL del usuario.
- Registro actualizado: BF-023 para recuperar reproducibilidad; estado distingue
  pruebas históricas exitosas de la suite actualmente incompleta.
- Otros hechos confirmados por lectura: Express básico, sin pool SQL ni React;
  `npm test` sigue siendo un marcador de ejemplo.
- Siguiente paso: terminar instalación del coordinador; después priorizar BF-023
  y BF-008 antes de la conexión segura BF-010.

## H-011 · Coordinador instalado y revisión cerrada · 2026-09-23

- BF-007 completado: perfil de proyecto guardado en
  `.codex/agents/coordinador_blue.toml` mediante escritura autorizada en la carpeta
  protegida. No se modificaron ajustes globales, modelo ni permisos heredados.
- Archivos de memoria: README, ESTADO, TABLERO, DECISIONES y BITACORA en esta carpeta;
  instrucciones generales en `AGENTS.md` de la raíz.
- Verificación: TOML parseado correctamente, campos obligatorios presentes y
  archivos de memoria encontrados. Un subagente `coordinador_blue` leyó el perfil
  explícitamente e hizo una revisión acotada, sin ejecutar tests ni consultas SQL.
- Hallazgos atendidos: D-011 ya no atribuye aprobación explícita de Kanban al usuario;
  la guía de base de datos indica que la suite actual está incompleta por faltar
  `pruebas.sql`. No se restauró ese archivo ni se cambió código de la tienda.
- Límite: no se verificó el descubrimiento automático del nuevo perfil por una
  sesión futura de la app. La memoria está en archivos y la invocación explícita
  permite leerla. No se creó vigilancia ni tarea programada en segundo plano.
- Siguiente paso propuesto: BF-023 (recuperar pruebas), BF-008 (Git) y BF-010
  (conexión backend con permisos limitados), al solicitar la próxima entrega.

## H-012 · Cierre de jornada y checklist · 2026-09-23

- El usuario decidió detener el trabajo por hoy, continuar mañana y pidió un
  resumen de lo completado y lo pendiente.
- Se creó `CIERRE-2026-09-23.md` y se dejó el punto de retorno en ESTADO/TABLERO.
- El resumen separa reglas acordadas, código existente y funciones pendientes;
  conserva la incidencia de `pruebas.sql` y los límites de verificación del HTML.
- No se implementaron funciones, ejecutaron pruebas ni tocaron datos para este cierre.
- Próxima secuencia propuesta: BF-023, BF-008 y BF-010. No se programó ejecución
  automática ni recordatorio; se espera la continuación del usuario.

## H-013 · Retorno y referencia de tienda · 2026-09-25

- Petición: recapitular lo listo y lo pendiente; usar Fragancias Boutique como
  guía aproximada para la tienda.
- Se leyó la memoria y se invocó el perfil `coordinador_blue` para revisión
  independiente de solo lectura. El agente principal es el único escritor de
  seguimiento en esta entrega.
- Comprobación actual: siguen ausentes `.git`, `frontend` y
  `backend/database/pruebas.sql`; el backend mantiene Express, JSON y
  `GET /api/health`, sin conexión SQL. `npm test` sigue siendo un ejemplo que falla.
- Se consultaron por web el inicio y la colección de tendencias de
  https://fraganciasboutique.com/. Se registró D-015 y una propuesta inicial para
  BF-013. El navegador visual no estuvo disponible: no se verificaron apariencia
  ni funcionamiento interactivo del sitio.
- Archivos afectados: ESTADO.md, TABLERO.md, DECISIONES.md y BITACORA.md.
  Se revisó su contenido actualizado. No se modificó código, ejecutó servidor,
  suite SQL ni consultas a la base del usuario.
- Las pruebas históricas y la instalación confirmada por el usuario se conservan
  como tales. La meta de fin de semana sigue sujeta a horas y alcance.
- Siguiente paso propuesto: BF-023 (recuperar/reconstruir pruebas), BF-008 (Git)
  y BF-010 (conexión segura backend/base); después API y frontend con la nueva guía.

## H-014 · Reconstrucción y prueba de la suite SQL · 2026-09-25

- Petición: crear nuevamente `backend/database/pruebas.sql` tras explicar su función.
- Se confirmó que seguía ausente y se reconstruyó a partir del esquema y del
  contrato del ejecutor: cinco pedidos ficticios; UUID terminados en 021/022;
  variante 2 con una unidad libre para la prueba con dos conexiones.
- Implementado: 73 comprobaciones SQL de cálculos, entrega pendiente, snapshots,
  integridad, idempotencia, revisión y monedas de pagos, inventario propio,
  devoluciones, atomicidad e inmutabilidad. Ayudantes temporales validan resultados
  y SQLSTATE; los fallos esperados revierten su operación. Guardas limitan el
  archivo al usuario/carpeta del servidor temporal y a tablas vacías.
- Revisión independiente de solo lectura: confirmó fixtures y ayudantes; se mejoró
  un caso para aislar el rechazo de un ajuste que deja físico menor que reservado.
- Comprobación: el primer arranque en sandbox falló por `restricted token`, código
  87 de `pg_ctl`. Se repitió fuera del sandbox con autorización. Una prueba detectó
  que PostgreSQL 18 devuelve `23001` para DELETE restringido; se corrigió la
  expectativa de la prueba, sin alterar la migración.
- Resultado final: `node backend/database/test-schema.cjs`, código 0. Instalación
  de 11 tablas; comprobaciones SQL; reejecución rechazada conservando datos;
  subtotal incorrecto rechazado al COMMIT; dos conexiones por la última unidad,
  con una sola reserva exitosa. La versión final pasó tras el ajuste de cobertura.
- Limpieza comprobada: el ejecutor cerró y eliminó sus servidores temporales.
  Se eliminó también la carpeta del primer arranque fallido tras verificar ruta
  absoluta dentro de `.tmp` y ausencia de `postmaster.pid`; quedaron cero carpetas
  `postgres-schema-*`. El coordinador revisó la coherencia documental del cierre.
- Archivos: `backend/database/pruebas.sql`, README de base de datos, ESTADO.md,
  TABLERO.md y BITACORA.md. No se modificaron migración, ejecutor ni base habitual.
- BF-023 terminado y reproducibilidad restablecida. Siguiente paso propuesto:
  BF-008 (Git), después BF-010 (conexión segura Express/PostgreSQL).

## H-015 · Primer historial Git y preparación para GitHub · 2026-09-25

- Petición: continuar tras BF-023; se inició el paso propuesto de Git y el usuario
  planteó usar GitHub. Se explicó cómo Git local y GitHub trabajan juntos.
- Revisión independiente: 22 archivos candidatos; exclusiones existentes de
  `.env`, variantes de `.env`, `node_modules`, logs y `.tmp` adecuadas. Búsqueda
  limitada de indicadores de credenciales sin imprimir valores: no se encontraron
  credenciales reales en los candidatos; el ejecutor genera las suyas temporales.
- Implementado: `git init -b main` y commit `6235fa8`,
  `chore: guardar base inicial de Blue Fragancias`, con los 22 archivos revisados.
  Se utilizó la identidad Git existente. No se alteró código ni migración SQL.
- El sandbox impidió escribir el índice. Las operaciones necesarias se ejecutaron
  con autorización fuera del sandbox. La carpeta `.git`, creada por el usuario del
  entorno aislado, pasó al propietario de la sesión habitual para permitir el uso
  normal de Git. No se añadieron excepciones globales de `safe.directory`.
- Comprobación: lista preparada revisada, patrones de exclusión comprobados,
  commit existente y estado limpio después del primer commit. `diff --check`
  señaló líneas vacías finales preexistentes en tres archivos; se conservaron y
  la revisión pasó desactivando únicamente `blank-at-eof` para ese comando.
  No se repitieron pruebas SQL ni se inició Express por esta tarea de versionado.
- GitHub: `gh` ausente; plugin encontrado y sugerido, sin instalación/conexión
  confirmada. Se preguntó si crear repositorio privado nuevo o usar uno existente;
  respuesta pendiente. Sin remoto configurado ni subida de archivos.
- Seguimiento actualizado: ESTADO.md, TABLERO.md, DECISIONES.md y BITACORA.md.
  BF-008 terminado; BF-024 registra la conexión y sincronización remota pendientes.
- Siguiente paso: completar acceso/destino GitHub (BF-024); después conectar
  Express con PostgreSQL (BF-010), con permisos limitados.

## H-016 · Repositorio existente asociado y subida verificada · 2026-09-25

- Petición: usar https://github.com/moisejos10/blue-fragancias.git, aportado por
  el usuario como su repositorio privado. D-016 actualizada; no se creó otro repo.
- Estado inicial: `main` local limpia, commits `6235fa8` y `2031345`, sin remoto.
  Git Credential Manager disponible; no había plugin GitHub conectado ni `gh`.
- Comprobación remota: `git ls-remote --symref` terminó con código 0 y sin ramas
  remotas. La primera consulta falló por red restringida del sandbox; fuera del
  sandbox, con autorización, funcionó usando la autenticación existente.
  No se extrajeron ni guardaron credenciales en archivos o memoria.
- Implementado: `origin` asociado al destino aportado; `git push -u origin main`
  creó `main` remota y configuró seguimiento de `origin/main`, sin force.
- Verificación de la primera subida: SHA local/remoto idéntico
  `20313455db17731c5a74d495e0e893084c56ec9f`, cero cambios locales pendientes.
  La revisión de alcance la hizo el coordinador; el agente principal ejecutó Git
  y es el único escritor de esta memoria.
- Privacidad: confirmada por el usuario; no se consultó la API de visibilidad ni
  se modificaron permisos. La subida del código no equivale a desplegar la tienda.
- Archivos de cierre: ESTADO.md, TABLERO.md, DECISIONES.md y BITACORA.md.
  Sin cambios en código, migración, base habitual o exclusiones de Git. No se
  repitieron pruebas SQL por esta entrega de sincronización.
- BF-024 terminado. Siguiente paso propuesto: BF-010, conectar Express con
  PostgreSQL mediante un rol de permisos limitados.

## H-017 · Descanso y punto de retorno · 2026-09-25

- El usuario confirmó que GitHub quedó listo, anunció un descanso y pidió conocer
  el siguiente paso. No pidió iniciar una nueva implementación durante su ausencia.
- Punto de retorno: BF-010. Explicar el papel del backend; preparar un usuario
  PostgreSQL exclusivo con permisos limitados; configuración privada de conexión;
  conectar Express y comprobar una consulta controlada desde el servidor.
- Criterio de éxito propuesto: el backend consulta la base con el rol limitado y
  maneja un fallo de conexión sin exponer credenciales. La API de catálogo se
  mantiene como BF-011, después de esta conexión inicial.
- Archivos actualizados: ESTADO.md, TABLERO.md y BITACORA.md. No se modificaron
  código ni base de datos ni se repitieron pruebas SQL para este cierre documental.
- No se programó ejecución ni recordatorio. Se continúa al regreso del usuario.

## Plantilla para próximas entradas

```text
## H-XXX · Título · AAAA-MM-DD (America/Caracas)
- Tarea del tablero / petición:
- Acción y motivo:
- Archivos o configuración afectados:
- Comprobación realizada y resultado (o pendiente):
- Decisiones aceptadas / preguntas abiertas:
- Siguiente paso:
```
