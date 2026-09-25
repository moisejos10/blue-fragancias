# Tablero de trabajo

Actualizado: 2026-09-25. Método: Pendiente → En desarrollo → En revisión → Terminado.
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
| BF-024 | Asociar GitHub y verificar el historial remoto | Repositorio existente `moisejos10/blue-fragancias`, privado según el usuario; `main` subida sin force, seguimiento `origin/main` y SHA local/remoto coincidente el 2026-09-25 |

## En desarrollo

Sin implementación activa tras completar BF-024. Siguiente entrega propuesta:
BF-010, conexión segura de Express con PostgreSQL. Fragancias Boutique queda
registrada como guía de BF-013, con diseño concreto pendiente (D-015).

## En revisión

Sin tareas en esta columna. La interacción del HTML es una comprobación pendiente
BF-009, separada de la entrega estática ya revisada.

## Pendiente

| ID | Prioridad | Tarea / resultado comprobable | Depende de |
|---|---|---|---|
| BF-009 | Baja | Abrir HTML local en navegador y comprobar selección de tablas y zoom | BF-006; acceso del usuario o herramienta compatible |
| BF-010 | Alta | Conectar Express con PostgreSQL mediante pool y rol limitado; ejecutar consulta controlada sin exponer secretos | BF-005, BF-008 y BF-023 completos |
| BF-011 | Alta | API de catálogo con productos/presentaciones, filtros, paginación y validación de parámetros | BF-010 |
| BF-012 | Alta | Elegir fuente EUR/VES y validar fecha, redondeo y tratamiento de fallos | P-002, P-003; BF-010 |
| BF-013 | Alta | Base React y diseño adaptable, guiado por la referencia D-015; mostrar un producto real de la API y estados de carga/error | BF-011; recursos visuales iniciales y diseño por concretar |
| BF-014 | Alta | Acceso administrativo, sesiones y autorización verificadas en el servidor | BF-010 |
| BF-015 | Alta | Administrar productos, imágenes y entradas de inventario con validación y permisos | BF-011, BF-014 |
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
