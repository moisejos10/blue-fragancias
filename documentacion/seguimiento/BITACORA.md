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
- Durante la sincronización, Git rechazó el primer push porque GitHub contenía
  el commit nuevo `3a45504` (`Delete AGENTS.md`). Se consultó el cambio y se preparó
  un merge sin commit con el cierre local `b37c3cc`, conservando ambos historiales.
- Bloqueo: la revisión automática rechazó el comando de commit/push porque
  confirmaría la eliminación de un archivo de instrucciones y controles sin
  autorización explícita. Ese comando no se ejecutó. Quedaron el merge preparado
  y cambios documentales locales, pendientes de decisión del usuario sobre
  `AGENTS.md`. No se usó force ni se probó una vía alternativa para eludirlo.
- No se programó ejecución ni recordatorio. Se continúa al regreso del usuario.

## H-018 · Instrucciones conservadas localmente y cierre del merge · 2026-09-25

- El usuario autorizó conservar `AGENTS.md` mientras se trabaja y retirarlo al
  finalizar; indicó expresamente que no lo quiere publicado en GitHub.
- Se restauró únicamente la copia de trabajo desde `b37c3cc`, manteniendo su
  retirada del índice preparada por el merge remoto. Se añadió `/AGENTS.md` a
  `.gitignore` para evitar incorporarlo a commits futuros por accidente.
- La primera restauración en sandbox falló al crear `index.lock`; se completó
  con autorización fuera del sandbox. Tras la nueva instrucción explícita y con
  la copia local conservada, la integración se confirmó y subió como `e823ad7`.
  La restricción previa de auto-review no se eludió: cambió la autorización y
  se preservaron las instrucciones locales.
- Verificación: hash de la copia local idéntico al original; archivo ignorado y
  ausente del índice; `AGENTS.md` ausente del árbol de `origin/main`; SHA remoto
  igual al local `e823ad76664b1b15b25ae50eb9f61bdec1284d4a`; sin `MERGE_HEAD`.
- Límite explicado: sigue existiendo en commits anteriores. No se reescribió
  historial ni se utilizó force. La retirada local al terminar queda registrada
  en D-017/BF-025; no se ejecuta durante el desarrollo.
- Archivos: copia local de `AGENTS.md`, `.gitignore`, README de seguimiento,
  ESTADO.md, TABLERO.md, DECISIONES.md y BITACORA.md. El coordinador revisó el
  alcance. No se cambió código de la tienda, base de datos ni migración y no se
  repitieron pruebas SQL por este ajuste de Git y documentación.
- Siguiente paso propuesto: BF-010, conectar Express a PostgreSQL con rol limitado.

## H-019 · Backend PostgreSQL preparado y probado; configuración habitual pendiente · 2026-09-25

- Petición: «vamos con postgrets», continuación de BF-010. Se leyó la memoria,
  el backend y las reglas locales antes de implementar.
- Comprobación del entorno: Node 22.22.2, PostgreSQL 18.6 y servicio activo.
  Una consulta administrativa no interactiva fue rechazada por falta de contraseña;
  no se consultaron ni modificaron datos de la base habitual. Se pidió al usuario
  abrir SQL Shell localmente, sin compartir su contraseña.
- Implementado: `002_rol_backend.sql`, que crea un rol nuevo `blue_fragancias_app`
  con lectura de cuatro tablas de catálogo y verifica permisos heredados inesperados.
  Si el rol ya existe, aborta sin cambiarlo. No otorga escrituras ni acceso a tablas
  privadas; no modifica permisos de PUBLIC ni otras bases. TEMP/CONNECT generales
  de PostgreSQL se documentan como límite, sin prometer aislamiento total.
- Backend: dependencia `pg` ^8.23.0; configuración validada, pool máximo 5 y tiempos
  límite; `/api/health` y `/api/health/db` con consulta parametrizada y HTTP 200/503
  sin SQL, credenciales ni datos privados. Cierre de HTTP y pool al detenerse.
- Configuración: `.env.example` versionable sin secreto, `.env` local ignorado y
  todavía sin PGPASSWORD. Scripts `db:check`, `start` y `dev` cargan `.env` mediante
  Node. `npm test` reemplaza el marcador anterior por siete pruebas funcionales.
- Revisión independiente: worker del backend y auditoría final de migración,
  permisos y errores; sin defectos bloqueantes encontrados. Solo el principal
  escribe el seguimiento. Las instrucciones locales AGENTS.md se actualizaron
  con los comandos nuevos, manteniéndolo fuera de Git.
- Instalación de pg: el sandbox bloqueó npm; la descarga autorizada desde npm
  terminó correctamente, con 14 paquetes añadidos y auditoría de npm sin hallazgos.
- Comprobaciones nuevas: `npm test` aprobó 7/7. `test-schema.cjs` ampliado terminó
  con código 0 en PostgreSQL temporal: rollback ante permiso privado de PUBLIC,
  autenticación real del rol limitado, lecturas y escrituras denegadas, repetición
  sin cambiar contraseña, tabla futura inaccesible, Express 200 con catálogo vacío
  y 503 con contraseña de prueba incorrecta; también pasaron las 73 comprobaciones
  SQL previas, subtotal al COMMIT y disputa por la última unidad.
- Comprobación habitual: `npm run db:check` se detuvo con «Falta configurar PGPASSWORD».
  BF-010 queda en revisión, no terminado ni desplegado. Siguiente acción del usuario:
  ejecutar 002 en SQL Shell, usar `\password blue_fragancias_app`, completar `.env`
  localmente y verificar conexión/HTTP. Guía paso a paso en `backend/README.md`.
- Archivos: `backend/src/{config,db,app,server}.js`, `backend/test/*.test.cjs`,
  `backend/scripts/check-db.cjs`, `backend/.env.example`, paquete/lock, migración 002,
  `test-backend.cjs`, ejecutor SQL y guías del backend; ESTADO/TABLERO/BITACORA.
  La migración 001 permanece intacta; `.env` y AGENTS.md permanecen locales.

## H-020 · Rol aplicado en la base habitual, confirmado por captura · 2026-09-25

- BF-010: tras aclarar la diferencia entre las preguntas de conexión y el prompt
  de psql, el usuario entró como `postgres` a `blue_fragancias` y ejecutó 002.
- Evidencia aportada: captura de SQL Shell 18.6 con `BEGIN`, `CREATE ROLE`,
  permisos, `ALTER ROLE`, verificaciones `DO`, `COMMIT` y mensaje final de éxito.
  Aplicación confirmada por el usuario; el agente no abrió otra conexión ni
  consultó datos de su base habitual.
- El siguiente paso es ejecutar `\password blue_fragancias_app` en esa sesión,
  elegir una contraseña local y después completar el `.env` privado.
  No repetir la migración. Asignación de contraseña y autenticación aún pendientes.
- Archivos actualizados: ESTADO.md, TABLERO.md y BITACORA.md. Solo seguimiento;
  no se cambió código ni se repitieron pruebas SQL por esta confirmación.
- BF-010 permanece en revisión hasta comprobar `npm run db:check` y HTTP 200
  con la configuración habitual. Las pruebas temporales anteriores son H-019.

## H-021 · Contraseña del rol asignada según el usuario · 2026-09-25

- El usuario respondió «listo» al paso `\password blue_fragancias_app`.
  Se registra como confirmación del usuario, no como autenticación comprobada.
- Se comprobó que `backend/.env` existe y está ignorado por Git; no se leyó ni
  mostró su contenido. Se consultó únicamente `.env.example`, sin credenciales.
- Siguiente paso: el usuario guarda la misma contraseña en `PGPASSWORD` dentro
  del `.env` local; luego comprobar `db:check` y HTTP con el rol limitado.
- Archivos: ESTADO.md, TABLERO.md y BITACORA.md. Sin cambios de código ni
  nuevas pruebas SQL; BF-010 permanece en revisión.

## H-022 · Cierre de conexión habitual · 2026-09-26

- Se registra la evidencia de la sesión anterior, tras confirmar el usuario
  «guardado». No son pruebas nuevas ejecutadas el 26 de septiembre.
- `npm run db:check` terminó con código 0: rol y base previstos y lectura de
  las cuatro tablas del catálogo correctos.
- Express y el pool habitual, con configuración del `.env` privado, respondieron
  HTTP 200 en /api/health y /api/health/db en un puerto efímero de loopback.
  La segunda respuesta fue únicamente {status:ok}, con Cache-Control no-store.
  Servidor y pool se cerraron. Sin escrituras ni exposición de credenciales.
- El coordinador revisó los criterios de cierre. BF-010 terminado localmente,
  no desplegado. Evidencia del manejo de 503 conservada en H-019.
- Archivos: ESTADO.md, TABLERO.md y BITACORA.md; cierre documental local,
  pendiente de sincronización. Código de conexión ya subido en ddf9ffc.
- Siguiente entrega propuesta: BF-011, comenzar por GET /api/productos.

## H-023 · Guía para visualizar la base en pgAdmin · 2026-09-26

- Petición: ver gráficamente la base existente en pgAdmin. Se explica localizar
  blue_fragancias y generar su ERD; pendiente de confirmación visual del usuario.
  No se operó pgAdmin ni se modificó la base.
- Referencia consultada: documentación oficial de pgAdmin, ERD Tool y Menu Bar.
- Se corrigió un fallo de codificación de la escritura documental anterior:
  algunos acentos quedaron como interrogaciones y sustituciones no se aplicaron.
  Se completó el cierre H-022 que faltaba y se reconciliaron los estados pendientes
  antiguos. No se alteró la evidencia ni se repitieron pruebas de base de datos.
- Archivos: ESTADO.md, TABLERO.md y BITACORA.md; revisión de diff y codificación.
- Siguiente paso: confirmar que el usuario ve las tablas y relaciones en pgAdmin.

## H-024 · Primer listado de catálogo y paginación · 2026-09-26

- El usuario confirmó «listo» tras la guía de pgAdmin y pidió seguir. La captura
  anterior demuestra las 11 tablas; el ERD queda confirmado por el usuario, no
  inspeccionado por el agente. Se inicia el primer paso de BF-011.
- Implementado GET /api/productos: campos públicos explícitos, productos activos,
  variantes activas, marca e imágenes ordenadas. IDs/decimales como texto, precio
  de referencia USD, disponibilidad booleana sin revelar saldos ni reservar stock.
- Paginación por ID ascendente: pagina=1 y limite=20 por defecto, topes 10000/50,
  fila adicional para hay_mas. Rechaza parámetros desconocidos, repetidos o fuera
  de rango con 400, antes de consultar SQL. Fallos SQL: 503 genérico, sin secretos.
- Imágenes conservan clave_archivo, sin inventar hosting/URLs. Producto activo
  sin variantes activas devuelve lista vacía. No se añadió tasa ni cálculo en Bs.
- Revisión acotada del coordinador, autorizada por AGENTS: sin bloqueantes;
  contrato y límites documentados. Solo el principal editó seguimiento.
- npm test: 11/11 aprobadas. PostgreSQL temporal: el primer intento detectó
  un fixture de inventario sin administrador; se corrigió el fixture con un
  administrador temporal y movimiento de entrada. La segunda ejecución completa
  terminó con código 0, incluidas pruebas previas de esquema y concurrencia.
- Prueba nueva de SQL/HTTP: catálogo vacío, exclusión de inactivos, IDs mayores
  de 2^53, precios exactos, disponibilidad, orden de imágenes, páginas sucesivas
  y vacías. Fixtures en transacción del servidor temporal, con rol limitado para
  las lecturas y rollback final; no se avanzaron secuencias ni se alteró la base habitual.
- Comprobación de lectura habitual con .env privado: HTTP 200 en /api/productos
  con pagina=1, limite=5, productos=[], hay_mas=false. Pool y servidor efímero
  cerrados; no quedaron procesos de la comprobación sirviendo la aplicación.
- Archivos: src/catalogo.js, src/app.js, test/app.test.cjs,
  database/test-catalogo.cjs, database/test-backend.cjs, backend/README.md y
  ESTADO/TABLERO/BITACORA. Migraciones 001/002 intactas. .env y AGENTS ignorados.
- Resultado: implementado y probado localmente, no desplegado; cambios de esta
  entrega aún sin sincronizar a GitHub. BF-011 sigue En desarrollo por filtros
  pendientes. Próximo paso: usuario abre el listado y conoce su respuesta JSON.

## H-025 · Filtros y búsqueda para el catálogo · 2026-10-01 (America/Caracas)

- Tarea del tablero / petición: continuar BF-011 después del listado y la
  paginación implementados en H-024.
- Acción y motivo: GET /api/productos ahora acepta búsqueda parcial `q` en nombre,
  descripción, familia olfativa y marca; marca exacta sin distinguir mayúsculas;
  género y tipo de presentación mediante valores permitidos. El tipo requiere una
  variante activa. Los filtros ocurren antes de paginar. Se mantienen parámetros
  SQL y errores 400 para valores inválidos, duplicados o desconocidos.
- Archivos afectados: backend/src/catalogo.js, backend/test/app.test.cjs (expectativa
  de parámetros actualizada), backend/README.md, ESTADO.md, TABLERO.md y BITACORA.md.
- Comprobación: revisión del cambio y actualización de documentación. No se
  ejecutaron pruebas; los filtros todavía no están probados localmente. Las
  comprobaciones anteriores de listado y paginación están en H-024.
- Decisiones/preguntas: sin cambio de reglas de negocio. No se incorporaron datos
  de productos ni cambios a la base habitual.
- Siguiente paso: abrir `/api/productos`, explicar su JSON y probar los filtros;
  después cerrar BF-011 según el resultado. BF-013/frontend sigue pendiente.

## H-026 · Revisión y cierre local de BF-011 · 2026-10-01 (America/Caracas)

- Petición: «ok revisa y continua». Revisión acotada y solo lectura del coordinador;
  el principal implementó correcciones, pruebas y seguimiento.
- Corrección: q ahora busca literalmente %, _, ! y barra inversa; antes ILIKE
  interpretaba comodines. Rechaza NUL en textos antes de SQL. Documentado que tipo
  selecciona productos con variante activa coincidente y devuelve todas las activas.
- Pruebas nuevas: npm test 11/11; se amplió validación HTTP de textos vacíos,
  largos, duplicados, arreglos y opciones inválidas. SQL/HTTP temporal ampliado con
  los cuatro campos de búsqueda, marca exacta, género, tipo, AND, inactivos,
  caracteres literales, texto parecido a SQL y paginación posterior al filtro.
- Primer intento de PostgreSQL temporal bloqueado por pg_ctl (token restringido
  del sandbox); reejecución autorizada fuera del sandbox: código 0, incluidos rol,
  precisión, imágenes, rollback, restricciones e inventario concurrente.
  El directorio del intento fallido se limpió tras verificar su destino dentro
  de .tmp y ausencia de postmaster.pid.
- Archivos: backend/src/catalogo.js, test/app.test.cjs, database/test-catalogo.cjs,
  backend/README.md y seguimiento. Sin cambios en migraciones ni datos habituales.
- Resultado: BF-011 terminado localmente y pendiente de sincronizar a GitHub.
  La evidencia anterior H-025 queda sustituida por estas pruebas nuevas, sin borrar
  su registro. Siguiente entrega: primera pantalla de BF-013.

## H-027 · Primera pantalla React del catálogo · 2026-10-01 (America/Caracas)

- El usuario eligió «azul cielo blanco y negro» (D-018). Se creó frontend React/Vite
  con cabecera, presentación visual propia y catálogo conectado a /api/productos.
- Implementado: formulario de búsqueda/marca/género/tipo, limpiar filtros,
  paginación, presentaciones desplegables y estados de carga, error/reintento y vacío.
  La revisión del coordinador detectó que «Desde» podía corresponder a otro tipo;
  se corrigió para calcularlo solo entre variantes del tipo seleccionado. Se limita
  la navegación al máximo de 10000 páginas admitido por el backend.
  Peticiones anteriores se cancelan; timeout de 10 segundos. Referencias USD;
  fotos públicas y producto real pendientes. La ilustración decorativa es propia.
- Archivos: frontend/package.json y lock, index.html, vite.config.js,
  src/main.jsx, src/App.jsx, src/styles.css, frontend/README.md y .gitignore (dist).
  Referencias técnicas oficiales React/Vite consultadas; D-015 consultada como guía
  de contenido, sin copiar fotos, textos ni productos de la tienda de referencia.
- Dependencias instaladas: React 19.3.0, Vite 8.3.2 y plugin React 6.1.1;
  npm reportó cero vulnerabilidades al instalar. Build de producción aprobado.
- Comprobación de lectura: frontend HTTP 200; proxy Vite → Express → base habitual
  con q=bleu, genero=masculino, tipo=frasco: HTTP 200, productos=[], pagina=1,
  limite=20, hay_mas=false. No se agregaron productos a la base habitual.
- Límite: inventario de navegadores vacío; abrir iab devolvió Browser is not
  available. No se afirma inspección visual ni prueba interactiva de React.
- Backend puerto 3000 y Vite 5173 quedaron iniciados para que el usuario vea la
  pantalla. El servidor SQL temporal exitoso y sus fixtures se cerraron/limpiaron.
  Arranque reproducible en frontend/README.md; disponibilidad depende de procesos.
- Estado: BF-013 parcial, no desplegado ni confirmado visualmente por el usuario.
  Próximo paso: revisión escritorio/móvil y primer producto real con foto; luego
  concretar fuente/vigencia EUR/VES (BF-012) antes de precios en Bs.

## H-028 · Carpeta para imágenes de la tienda · 2026-10-01 (America/Caracas)

- Petición: crear una carpeta para que el usuario facilite logos y fotos de perfumes.
- Creada `imagenes-tienda/` con `logos`, `perfumes`, `banners` y `referencias`;
  README con ejemplos de nombres y organización. Archivos .gitkeep conservan
  las subcarpetas vacías en Git.
- Archivos: nueva carpeta y ESTADO/TABLERO/BITACORA. Comprobación de existencia
  y estructura; sin ejecutar pruebas de aplicación por este cambio de carpetas.
- Resultado: espacio preparado; imágenes todavía pendientes de aportar y de
  incorporar al frontend. BF-013 continúa parcial.
- Siguiente paso: el usuario copia las imágenes y avisa para revisarlas.

## H-029 · Imágenes provisionales y diseño de tienda · 2026-10-01 (America/Caracas)

- El usuario autorizó continuar con imágenes de referencia y aportar después
  logo/fotos reales (D-019), manteniendo la paleta D-018.
- Tres imágenes propias generadas mediante ImageGen integrado: cielo, floral y
  amaderada. Salidas inspeccionadas y copiadas a frontend/public/referencias;
  prompts completos y usos registrados en documentacion/RECURSOS-VISUALES.md.
- Portada fotográfica, sección de inspiración con botones de búsqueda, marcador
  visible de imagen provisional y sustituto para productos sin foto. No se
  inventaron productos/precios ni se cargaron fixtures en la base habitual.
- El frontend consulta /api/tienda para mostrar un logo subido y las URLs públicas
  controladas del catálogo para fotos reales. Enlace /admin añadido al pie.
- Archivos: frontend/src/App.jsx, styles.css, public/referencias, README y guía
  visual. Compilación aprobada; HTTP 200 de portada y las tres imágenes.
- Limitación: navegador conectado no disponible (inventario vacío); apariencia
  e interacciones React todavía no inspeccionadas. BF-013 permanece parcial.

## H-030 · Panel gráfico y administración del catálogo · 2026-10-01 (America/Caracas)

- Petición: catálogo actualizable de forma gráfica sin editar código (D-020);
  usuario pidió continuar tras interrupciones. Revisión acotada del coordinador,
  solo lectura; principal único escritor de código y seguimiento.
- Implementado: /admin con login, listado/búsqueda, crear/editar productos y
  presentaciones/precios, guardar borrador, publicar/ocultar, portada de producto,
  logo y entradas positivas de inventario. Formularios conectados a API/PostgreSQL.
- Autenticación Argon2id y sesión de 8 horas con hash de token en PostgreSQL;
  cookie HttpOnly/SameSite, Secure en producción, origen permitido + CSRF en
  escrituras y limitador de intentos. Sin registro HTTP público de administradores.
- Nueva 003 (001/002 intactas): sesiones_admin, configuracion_tienda, permisos
  por columnas y función de entradas con rol técnico NOLOGIN. El app no recibe
  INSERT/UPDATE de saldos, inserción libre de movimientos ni lectura de pedidos/pagos.
  Bootstrap único revoca su permiso al crear la primera cuenta.
- Productos y variantes se guardan transaccionalmente. Versiones detectan edición
  concurrente; entradas tienen clave idempotente, motivo y administrador de sesión.
  No se implementaron ajustes negativos, reservas/ventas ni devoluciones desde el panel.
- Subidas autenticadas antes del multipart: hasta 5 MB/20 MP, JPG/PNG/WebP estático,
  validación real y reexportación WebP. Nombres UUID; fotos de borradores privadas;
  reemplazos sin referencias se limpian tras COMMIT. Una portada por producto.
- Revisión del coordinador resuelta: rechazar variante NULL en función SQL,
  revocar bootstrap al usarlo y limpiar imágenes/logo reemplazados. Pruebas nuevas
  de estas correcciones aprobadas. Guía inicial y uso cotidiano en
  documentacion/PANEL-ADMINISTRACION.md; scripts interactivos admin:instalar/crear.
- Archivos: backend/src/admin-auth.js, admin-catalogo.js, media.js, app.js,
  catalogo.js; migración 003, test-admin.cjs, test-schema.cjs, app.test.cjs;
  scripts/crear-admin.cjs e instalar-admin.cjs; package/lock/.env.example;
  frontend/src/Admin.jsx, admin.css, main.jsx, vite.config.js; .gitignore y guías.
- Comprobaciones nuevas: npm test 12/12; suite PostgreSQL temporal código 0,
  incluidos permisos/login/logout/caducidad/CSRF, rollback, precisión, edición
  concurrente, idempotencia, fotos/privacidad/reemplazo/limpieza y logo, más pruebas
  anteriores de esquema/inventario. Scripts CLI: node --check correcto.
  Build React aprobado. Servidor SQL temporal cerrado y su directorio limpiado.
- Lectura habitual por proxy: /, /admin, tres referencias, /api/tienda y
  /api/productos HTTP 200; /api/admin/sesion sin cookie: 401. Estas respuestas
  no demuestran activación ni guardado del panel en la base habitual.
- Activación habitual pendiente: intento administrativo psql -w sin credenciales
  guardadas respondió «no password supplied». No se aplicó 003 ni se crearon
  cuentas/datos en la base habitual. El propietario introduce su clave en terminal.
  El .env privado se utiliza para el backend sin mostrar su contenido.
- Backend de desarrollo iniciado y Vite existente en 5173 reutilizado tras detectar
  puerto ocupado; módulos/recursos actuales responden HTTP. Disponibilidad depende
  de procesos locales. Sin inspección visual por falta de navegador conectado.
- Estado: BF-014/015 en revisión (código/pruebas temporales completos, instalación
  habitual y clics reales pendientes); BF-013 parcial. Todo local, sin push/despliegue.
- Siguiente paso: ejecutar los dos comandos iniciales de la guía, entrar al panel
  y crear el primer perfume real. Respaldos de fotos/base, HTTPS, recuperación de
  contraseña y limitador compartido quedan pendientes según alcance/despliegue.

## H-031 · Cuenta administrativa solicitada · 2026-10-01 (America/Caracas)

- Petición: crear la cuenta del propietario con las credenciales que eligió.
- Corrección del estado anterior: la consulta nueva a la base habitual detectó
  sesiones_admin, configuracion_tienda y crear_primer_administrador presentes.
  No se ejecutó de nuevo 003; no se verificó quién la instaló.
- Se creó la primera cuenta mediante la función autorizada del rol limitado.
  Contraseña recibida en memoria, sin eco, y almacenada como hash Argon2id;
  credenciales excluidas de código, documentación y salidas.
- Comprobación nueva en base habitual: login HTTP 200, sesión autenticada HTTP
  200 y logout HTTP 204. La sesión de comprobación quedó cerrada.
- Archivos: seguimiento actualizado; auxiliares temporales eliminados. No se
  modificó el código del producto ni se repitieron suites generales.
- Estado: panel activado localmente; revisión visual y creación de producto
  mediante la interfaz pendientes. Sin despliegue.
- Siguiente paso: entrar en /admin con la cuenta elegida y cargar el catálogo.

## H-032 · Inicio local y apertura de Chrome pendiente · 2026-10-15 (America/Caracas)

- Petición: ver el avance del proyecto y abrirlo en Google Chrome.
- Acción: revisión de memoria y código; coordinación acotada de solo lectura.
  Se lanzaron backend y Vite con procesos ocultos y logs locales bajo .tmp.
- La herramienta de navegación no enumeró navegadores. El control de ventanas
  encontró Chrome, pero se detuvo al no poder identificar con certeza su URL.
  No se abrió ni inspeccionó la tienda en el navegador.
- El inicio de procesos quedó verificado posteriormente por HTTP en H-033.
- Sin migraciones, cambios de credenciales, datos de catálogo ni despliegue.

## H-033 · Verificación local del proyecto · 2026-10-15 (America/Caracas)

- Petición: tomar control y hacer las pruebas. Principal único escritor de memoria;
  agentes separados para backend/build/db:check y PostgreSQL temporal; coordinador
  de solo lectura revisó alcance, verificaciones y diferencias documentales.
- Comprobaciones nuevas: npm --prefix backend test, 12/12 aprobadas, código 0;
  npm --prefix frontend run build, código 0, 18 módulos, sin advertencias;
  npm --prefix backend run db:check, código 0, rol limitado y lectura de cuatro
  tablas del catálogo aprobados. No se imprimió el .env ni credenciales.
- node backend/database/test-schema.cjs: primer intento bloqueado por sandbox
  al iniciar pg_ctl (restricted token 87 y start server 3). Reejecución con
  escalación específica aprobada, código 0: esquema, catálogo, permisos, cálculos,
  históricos, pagos, inventario, concurrencia y administración (sesiones, CSRF,
  rollback, edición concurrente, entradas idempotentes, fotos, logo y limpieza).
  Servidor temporal detenido y eliminado; cero directorios postgres-schema-*.
  La base habitual no se usó para esas escrituras.
- Prueba HTTP actual sobre Vite: 28 comprobaciones aprobadas; HTML/recursos,
  imágenes, catálogo y health/db 200; validación 400, acceso/escritura anónimos 401,
  origen externo 403 e imagen inexistente 404. Catálogo inicial: cero productos.
  Los POST negativos se rechazaron; no se creó mercancía ficticia.
- Nuevo intento de abrir Chrome por herramienta de navegador devolvió
  «Browser is not available: chrome». Revisión visual e interactiva pendiente;
  no se repitió login con la cuenta habitual ni se afirma prueba móvil.
- Archivos: ESTADO.md, TABLERO.md, BITACORA.md y VERIFICACION-2026-10-15.md.
  Auxiliares/evidencia local en .tmp/comprobar-http-20261015.cjs y
  .tmp/comprobacion-http-20261015.json; build generado en frontend/dist.
  Código de producto y migraciones sin cambios en esta entrega.
- Precisión documental: H-031 acredita activación habitual, aunque D-020 y las
  guías iniciales aún conservan la redacción anterior «pendiente». El diagrama
  muestra las 11 tablas iniciales, sin sesiones_admin/configuracion_tienda de 003.
- Estado: BF-014/015 en revisión y BF-013 parcial; BF-009 pendiente.
  Sin push ni despliegue. Siguiente paso: recuperar acceso de navegador, revisar
  tienda/panel/diagrama mediante clics y después cargar el primer producto real.

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
