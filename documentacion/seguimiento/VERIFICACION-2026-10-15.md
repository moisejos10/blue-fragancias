# Verificación local · 15 de octubre de 2026

Zona: America/Caracas. Petición: comprobar el proyecto y tomar control del navegador.

Las comprobaciones automatizadas ejecutadas hoy aprobaron. La revisión visual e
interactiva sigue pendiente por falta de acceso de la herramienta a Chrome.

| Comprobación nueva | Resultado | Alcance |
|---|---|---|
| `npm --prefix backend test` | 12/12 aprobadas, salida 0 | Configuración, HTTP y rechazos de seguridad sin base |
| `npm --prefix frontend run build` | Salida 0; 18 módulos, sin advertencias | Compilación de producción; no acredita apariencia |
| `npm --prefix backend run db:check` | Salida 0 | Conexión habitual con rol limitado y lectura de cuatro tablas del catálogo |
| `node backend/database/test-schema.cjs` | Salida 0 tras escalación específica | PostgreSQL temporal independiente: esquema, catálogo, administración y concurrencia |
| Comprobación HTTP sobre `127.0.0.1:5173` | 28/28 aprobadas | Vite, proxy Express y base habitual; sin cambios de datos |

## PostgreSQL temporal

Se verificaron restricciones, cálculos, precios históricos, pagos, movimientos de
inventario, competencia por la última unidad, rollback, permisos y rechazo de
reejecución de migración. El panel cubrió sesiones, acceso, CSRF, edición concurrente,
entradas idempotentes, imágenes privadas/publicadas, reemplazo, limpieza y logo.

El sandbox bloqueó inicialmente `pg_ctl` con errores 87/3. La ejecución específica
fuera del sandbox aprobó. El servidor temporal se detuvo y se limpiaron tanto el
intento fallido como el satisfactorio: cero directorios `postgres-schema-*` restantes.
Las escrituras de esta suite no se ejecutaron en la base habitual.

## HTTP habitual

- HTTP 200: `/`, `/admin`, cinco módulos/estilos de React, las tres imágenes
  provisionales, `/api/health`, `/api/health/db`, `/api/tienda` y cuatro consultas
  válidas de catálogo, incluidas búsquedas con caracteres especiales.
- HTTP 400: cinco consultas con paginación, género, presentación o parámetros
  duplicados inválidos.
- HTTP 401: sesión, catálogo y medio administrativo anónimos; creación anónima.
- HTTP 403: escritura administrativa desde origen externo.
- HTTP 404: imagen pública inexistente.

Catálogo inicial: `productos=[]`, página 1, límite 12, `hay_mas=false`.
Los rechazos 400/401/403/404 fueron los resultados esperados de las pruebas.
Las escrituras administrativas negativas se rechazaron y no crearon productos.

Evidencia detallada local: `.tmp/comprobacion-http-20261015.json`; ejecutor puntual
`.tmp/comprobar-http-20261015.cjs`. Ambos permanecen fuera de Git.

## Revisión pendiente

La apertura automática anterior por control de ventanas se detuvo porque la
herramienta no pudo identificar la URL actual. El intento actual por la herramienta
de navegación respondió `Browser is not available: chrome`.

No se acreditan capturas, clics, validación visual móvil ni login habitual nuevo.
BF-014/015 permanecen en revisión; BF-013 sigue parcial y BF-009 pendiente.
La tienda continúa local en http://127.0.0.1:5173 y el panel en `/admin`.

Siguiente paso: recuperar acceso de navegador para probar filtros, navegación,
formularios y selección/zoom del diagrama. Después, cargar el primer producto real.
El diagrama existente representa las once tablas iniciales; 003 añadió dos tablas.

No se modificaron código de producto, migraciones, credenciales ni catálogo real.
No se publicó el proyecto ni se realizó push.
