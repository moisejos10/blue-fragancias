# Blue Fragancias: acuerdos del proyecto

## Contexto y forma de trabajo

- Responder en español. El usuario aprende construyendo: explicar el propósito,
  proponer un paso pequeño, realizar o guiar el cambio solicitado y comprobarlo.
- Respetar el alcance de cada petición. Crear código cuando el usuario lo pida;
  no avanzar automáticamente por todo el backlog ni sustituir su aprendizaje.
- Stack acordado: React, JavaScript, Node.js, Express y PostgreSQL/SQL.
- La meta es una primera versión durante el fin de semana; la fecha y el alcance
  siguen sujetos a horas disponibles, pruebas y preparación para lanzamiento.

## Memoria y coordinación

- Antes de trabajo sustantivo, leer `documentacion/seguimiento/ESTADO.md` y
  `documentacion/seguimiento/TABLERO.md`. Consultar `DECISIONES.md` cuando una
  regla de negocio sea relevante y la bitácora para recuperar antecedentes.
- El agente de coordinación es `coordinador_blue`, definido en
  `.codex/agents/coordinador_blue.toml`. Para revisar un hito o planificar una
  entrega, delegar una revisión acotada cuando aporte valor. Si las herramientas
  no permiten seleccionar ese perfil, leer sus instrucciones y transmitirlas
  al subagente. Si no hay delegación disponible, el agente principal asume el rol.
- No delegar el coordinador en sí mismo ni crear cadenas de coordinadores.
- El agente principal es responsable de cerrar la memoria: tras cambios,
  verificaciones, decisiones o bloqueos relevantes, actualizar estado/tablero
  y añadir una entrada a la bitácora antes de terminar la tarea. Una explicación
  sin novedad no necesita una entrada repetida.
- Dar un solo escritor a los archivos de seguimiento por entrega. Los demás
  agentes devuelven evidencia y hallazgos; no editan el mismo tablero a la vez.
- Registrar resultado, archivos, comprobación y siguiente paso. Distinguir:
  propuesto, implementado, probado localmente, confirmado por el usuario y
  desplegado. Un test antiguo no cuenta como una prueba nueva.
- No borrar decisiones ni reescribir el historial para ocultar cambios. Añadir
  correcciones explícitas. No guardar contraseñas, tokens ni datos de clientes.
- La memoria son estos archivos. No afirmar supervisión en segundo plano,
  recordatorios programados o persistencia ilimitada de una sesión.

## Reglas de negocio que se deben preservar

- Referencia en USD; importe en Bs calculado con la tasa EUR/VES:
  `round((subtotal_ref_usd + costo_entrega_ref_usd) * tasa_eur_ves, 2)`.
  Es una regla comercial explícita, no conversión USD/VES. No inventar tasas.
- Compra de invitado; guardar pedido antes de abrir WhatsApp. El cliente envía
  el mensaje. Abrir WhatsApp no confirma la orden ni acredita el pago.
- Entregas: envío nacional, delivery y pickup. Pagos: Pago Móvil, Binance Pay y
  efectivo, con registro y revisión manual en la primera versión.
- Preservar precios históricos, moneda real recibida, tasa, vigencia y fuente.
- Catálogo real de frascos/decants/muestras, fuente API, plazos de reserva y
  reglas de entrega/pago pendientes: ver `DECISIONES.md`, sin inventarlos.

## Calidad y seguridad

- Revisar los archivos antes de cambiarlos; conservar el trabajo del usuario.
- No usar `postgres` como usuario del backend ni guardar secretos en código.
- Usar consultas parametrizadas, validación y autorización del lado servidor.
- Mantener pedidos, detalle y reservas en transacciones; los saldos se modifican
  mediante movimientos, no por escrituras directas desde la aplicación.
- No cambiar una migración ya aplicada para actualizar una base existente:
  agregar una migración numerada nueva. No borrar ni recrear la base del usuario.
- Credenciales, datos de pedidos y comprobantes deben permanecer privados.
- Ejecutar comprobaciones proporcionadas al cambio; no repetir pruebas pesadas
  por editar documentación. La prueba SQL usa un servidor temporal independiente.
- `backend/package.json` tiene por ahora un `npm test` de ejemplo que falla;
  no presentarlo como una suite funcional. Prueba del esquema:
  `node backend/database/test-schema.cjs` desde la raíz, si el cambio lo requiere.
  Consultar su reproducibilidad actual en ESTADO.md antes de ejecutarla.
- Para actualizar gráficos: `node documentacion/generar-diagrama.cjs` regenera
  HTML y SVG; el PNG necesita otra exportación. No afirmar inspección del navegador
  si solo se validó el código o una imagen.
