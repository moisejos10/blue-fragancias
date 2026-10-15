# Tablero de trabajo

Actualizado: 2026-10-15. Método: Pendiente → En desarrollo → En revisión → Terminado.
Si existe una dependencia externa, marcar «Bloqueado» con causa y siguiente acción.
Máximo una entrega funcional principal en desarrollo; revisiones independientes
pueden ir en paralelo. No avanzar sin una petición que autorice el trabajo.

## Terminado

| ID | Tarea | Evidencia / criterio cumplido |
|---|---|---|
| BF-001 | Acordar stack y flujo comercial inicial | Decisiones de precios, invitados, WhatsApp, entrega y métodos de pago registradas |
| BF-002 | Preparar Node/npm/Git/PostgreSQL y conectar con psql | Capturas y consulta SQL aportadas por el usuario; Git instalado, no repositorio iniciado |
| BF-003 | Crear esquema SQL inicial | 11 tablas; script instalador y migración transaccional existentes |
| BF-004 | Probar restricciones del esquema | Pruebas históricas en PostgreSQL temporal: cálculos, duplicados, reservas, devoluciones y última unidad concurrente |
| BF-005 | Instalar las tablas en blue_fragancias local | Usuario compartió salida con COMMIT; confirmación del usuario, no reconexión del agente |
| BF-006 | Documentar el modelo relacional | Guía y gráficos HTML/SVG/PNG con 11 tablas, 16 FK y 110 campos; PNG inspeccionado |
| BF-007 | Configurar coordinador y memoria del proyecto | Perfil local válido e instalado, AGENTS.md y memoria presentes; perfil disponible e invocado para revisión acotada el 25 de septiembre |
| BF-023 | Reconstruir `backend/database/pruebas.sql` y recuperar la suite temporal | Probado localmente el 2026-09-25: 73 comprobaciones SQL y ejecutor completo con código 0, incluido subtotal al COMMIT y disputa por la última unidad; migración y base habitual intactas |
| BF-008 | Crear repositorio Git inicial y primer punto de recuperación | Rama `main`, commit `6235fa8`, 22 archivos revisados; dependencias, `.env`, logs y temporales excluidos; verificado localmente el 2026-09-25 |
| BF-024 | Asociar GitHub y verificar el historial remoto | Repositorio existente `moisejos10/blue-fragancias`, privado según el usuario; sincronización del avance actual el 2026-10-15: `d9aec80` subido sin force a `main`, SHA local/remoto coincidente (H-034) |
| BF-010 | Conexión Express/PostgreSQL con pool y rol limitado | db:check y ambas rutas HTTP aprobados contra la base habitual en la sesión anterior; cierre registrado el 26 de septiembre en H-022. Funciona localmente, no desplegado |
| BF-011 | Catálogo público con paginación, búsqueda y filtros | Terminado localmente el 2026-10-01: 11 pruebas HTTP/configuración y suite PostgreSQL temporal aprobadas, con búsqueda literal, combinaciones y paginación filtrada. HTTP habitual por proxy 200 con catálogo vacío; no desplegado (H-026) |

## En desarrollo

Sin nueva entrega funcional principal iniciada. Próximo paso: revisar de forma
interactiva la administración local ya activada y crear el primer producto.
`AGENTS.md` sigue local e ignorado por Git (D-017); retirada al cierre en BF-025.

## En revisión

**Administración local del catálogo (BF-014 + BF-015):** login/sesiones y panel
de productos, variantes/precios, portada, logo, publicación y entradas de inventario
implementados. 12 pruebas HTTP/configuración y suite PostgreSQL temporal ampliada
aprobadas nuevamente el 2026-10-15. Compilación React, db:check habitual y 28
comprobaciones HTTP por proxy aprobadas (H-033). PostgreSQL temporal detenido
y limpiado; no se cargaron datos de prueba en la base habitual.
Activación habitual comprobada en H-031: tablas/función 003 presentes y primera
cuenta solicitada creada, con login/sesión HTTP 200 y logout 204. No se repitió
la migración. Pendientes: revisión interactiva y primer producto desde el panel.
La herramienta de navegación no tiene Chrome disponible y el intento previo de
control de ventanas no pudo identificar la URL; no se acredita revisión visual.

**BF-013 parcial:** pantalla con azul cielo/blanco/negro y tres referencias visuales
de ImageGen autorizadas en D-019. Portada, inspiración, catálogo, filtros y enlace
al panel; build y HTTP/proxy aprobados. Falta navegador para revisión visual y
primer producto real (P-004/P-009). Carpeta `imagenes-tienda/` disponible.
Verificación nueva del 15 de octubre en
[VERIFICACION-2026-10-15.md](VERIFICACION-2026-10-15.md); catálogo habitual vacío.
Tienda, catálogo, panel, pruebas y documentación subidos a GitHub en `d9aec80`
el 15 de octubre (H-034). Continúan las revisiones pendientes; no hay despliegue.

La interacción del HTML sigue como comprobación pendiente BF-009.

## Pendiente

| ID | Prioridad | Tarea / resultado comprobable | Depende de |
|---|---|---|---|
| BF-009 | Baja | Abrir HTML local en navegador y comprobar selección de tablas y zoom | BF-006; acceso del usuario o herramienta compatible |
| BF-025 | Baja | Retirar la copia local de `AGENTS.md` al finalizar el trabajo, según D-017; mientras tanto conservarla excluida de Git | Cierre del desarrollo; no ejecutar ahora ni reescribir historial por esta tarea |
| BF-012 | Alta | Elegir fuente EUR/VES y validar fecha, redondeo y tratamiento de fallos | P-002, P-003; BF-010 |
| BF-016 | Alta | Carrito y pedido invitado transaccional con datos de entrega, idempotencia y reservas | BF-011, BF-012, BF-013; P-005, P-006 |
| BF-017 | Alta | Enlace WhatsApp generado desde pedido persistido, sin marcar enviado/pagado automáticamente | BF-016; número comercial |
| BF-018 | Alta | Registro y revisión de pagos; conciliación, estados y manejo de efectivo | BF-014, BF-016; P-007, P-008 |
| BF-019 | Alta | Vencimiento/cancelación de reservas, venta y devolución consistentes | BF-016; reglas de P-005 |
| BF-020 | Alta | Prueba temprana de despliegue con HTTPS y base separada; secretos fuera del repositorio | BF-010; P-010 |
| BF-021 | Alta | Validar recorridos críticos, permisos, errores, concurrencia y rendimiento según alcance | BF-015 a BF-020 |
| BF-022 | Alta | Publicar versión acordada con datos reales, respaldo/restauración y revisión final | BF-021; P-001, P-004, P-009 |

## Cierre de una tarea

Registrar los archivos modificados y la comprobación con su resultado en la
bitácora. Especificar qué queda fuera. Mover a Terminado solo cuando se cumpla su
criterio; no equiparar «archivo creado» con «servicio funcionando» ni «funciona
localmente» con «desplegado». Mantener las decisiones pendientes visibles.
