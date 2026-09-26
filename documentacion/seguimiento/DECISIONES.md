# Decisiones y preguntas abiertas

Registro inicial: 2026-09-23. Fuente: conversación de este proyecto y archivos
actuales. «Aceptada» significa una elección del usuario o un diseño aplicado;
«Propuesta» no debe convertirse silenciosamente en una regla aprobada.

| ID | Estado | Decisión | Motivo / fuente |
|---|---|---|---|
| D-001 | Aceptada por el usuario | React, JavaScript, Node.js, Express y SQL; PostgreSQL instalado como motor relacional | Stack pedido y proceso de instalación completado |
| D-002 | Aceptada por el usuario | Aprender desde cero, con explicación, pasos pequeños y comprobaciones | Objetivo educativo explícito; respetar peticiones puntuales de implementar |
| D-003 | Aceptada por el usuario | Referencia en USD e importe Bs = referencia × tasa EUR/VES | Aclaración expresa: usar el valor numérico de la referencia con tasa euro |
| D-004 | Aceptada por el usuario | Pedidos sin cuenta de cliente, guardados antes de abrir WhatsApp | Confirmación de pedido y pago coordinada por WhatsApp |
| D-005 | Aceptada por el usuario | Envíos nacionales, delivery y pickup | Modalidades confirmadas |
| D-006 | Aceptada por el usuario | Pago Móvil, Binance Pay y efectivo | Se aclaró que Binance significa Binance Pay |
| D-007 | Diseño inicial documentado | Registro y revisión manual de pagos; sin confirmación automática | Alcance de primera versión y confirmación por WhatsApp; no hay integración de cobro |
| D-008 | Diseño aplicado | Separar perfume de presentación: productos y variantes | Permite varios volúmenes/precios/stock sin decidir aún el catálogo real |
| D-009 | Diseño aplicado | Pedidos conservan precios del detalle y tasa histórica; NULL en entrega significa pendiente | Restricciones y columnas calculadas del esquema instalado |
| D-010 | Diseño aplicado | Modificar inventario mediante movimientos dentro de transacciones | Triggers y restricciones comprobados; permisos del backend pendientes |
| D-011 | Método propuesto y adoptado para coordinación | Kanban con entregas pequeñas | Plan propuesto tras corrección del usuario; no se registró aprobación explícita de esa metodología; tareas en TABLERO.md |
| D-012 | Objetivo, no compromiso cerrado | Primera versión para el fin de semana 26–27 de septiembre | Meta del usuario; horas disponibles y tipo de lanzamiento pendientes |
| D-013 | Aceptada por el usuario | Mantener documentación en `documentacion` | Petición explícita del diagrama y explicaciones |
| D-014 | Aceptada por el usuario | Crear coordinador que organice, supervise y conserve memoria del trabajo | Solicitud actual; memoria en archivos del proyecto, sin programación de revisiones |
| D-015 | Referencia aportada por el usuario · 2026-09-25 | Usar https://fraganciasboutique.com/ como guía aproximada para Blue Fragancias | Orienta la tienda; colores, composición y funciones concretas siguen por definir |
| D-016 | Aceptada por el usuario · 2026-09-25 | Usar el repositorio existente https://github.com/moisejos10/blue-fragancias.git junto con Git local | Tras la propuesta de crear uno nuevo, el usuario aportó este destino y confirmó que es privado. Rama `main` y remoto `origin`; no se cambia su visibilidad |
| D-017 | Aceptada por el usuario · 2026-09-25 | Conservar `AGENTS.md` localmente durante el trabajo y retirarlo al finalizar; excluirlo de GitHub | El usuario no quiere ese archivo publicado. Implementado mediante copia local intacta y `/AGENTS.md` en `.gitignore`; ausente de `main` actual. Historial anterior conservado, sin purga ni force; retirada local pendiente en BF-025 |

## Referencia de tienda · D-015

- Fuentes consultadas el 25 de septiembre: [inicio](https://fraganciasboutique.com/)
  y [colección de tendencias](https://fraganciasboutique.com/collections/tendencia).
- El contenido consultado muestra buscador, carrito, productos destacados,
  imágenes y precios, datos de volumen/concentración/familia olfativa, además de
  controles de filtro y orden en la colección.
- Propuesta para BF-013: inicio con productos destacados, catálogo con búsqueda
  y filtros, ficha por perfume con selección de presentación y acceso al carrito.
  La selección visual y el alcance exacto se concretarán al diseñar.
- Conservar el flujo acordado de Blue Fragancias: compra invitada, regla de tasa
  EUR/VES y pedido persistido antes de abrir WhatsApp.
- Alcance de revisión: lectura web de contenido; no hubo navegador disponible
  para verificar apariencia o interacciones. No se implementó frontend ni se
  incorporaron imágenes, textos o productos del comercio de referencia.

## Por definir, en orden de impacto

| ID | Pregunta | Cuándo resolverla |
|---|---|---|
| P-001 | ¿Cuántas horas están disponibles y el domingo se busca demo o ventas reales? | Antes de comprometer alcance y fecha |
| P-002 | ¿Qué fuente fiable proporciona EUR/VES y qué vigencia máxima se admite si falla? | Antes de implementar precios en vivo |
| P-003 | ¿Se autoriza una tasa manual de respaldo con fuente y fecha visibles? | Si la API no queda resuelta; fue propuesta, no aprobada |
| P-004 | ¿Frascos, decants, muestras y cuáles presentaciones se venderán al inicio? | Antes de cargar catálogo real |
| P-005 | ¿Cuánto dura una reserva y en qué momento se materializa la venta? | Antes del checkout con inventario |
| P-006 | ¿Cómo se cotizan delivery/envíos y dónde se hace pickup? | Antes de mostrar entrega al cliente |
| P-007 | ¿Cuándo se recibe efectivo y en cuáles monedas? | Antes de cerrar el flujo de pedidos/pagos |
| P-008 | ¿Qué moneda se recibirá por Binance Pay y cómo se concilian importes/parciales? | Antes de aceptar pagos reales |
| P-009 | ¿Qué fotos, productos, identidad visual y número de WhatsApp comercial se usarán? | Antes de finalizar catálogo y enlace comercial |
| P-010 | ¿Proveedor de hosting, presupuesto, dominio y entorno de pruebas? | Prueba temprana de despliegue |

No pedir todas las respuestas a la vez: solicitar las que desbloqueen la próxima
entrega. Evitar solicitar contraseñas, tokens o comprobantes privados en el chat.
