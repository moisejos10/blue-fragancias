# Frontend de Blue Fragancias

Primera pantalla React con azul cielo, blanco y negro, elegidos por el usuario.
Vite sirve la aplicación localmente y prepara sus archivos para un futuro despliegue.

## Ejecutar

Desde la raíz, abrir dos terminales:

```powershell
npm --prefix backend run dev
```

```powershell
npm --prefix frontend run dev
```

Abrir http://127.0.0.1:5173. Detener cada proceso con Ctrl+C. En una copia nueva,
ejecutar primero `npm --prefix frontend ci` y configurar el backend según su guía.

Vite reenvía `/api` y `/media` a Express en `http://127.0.0.1:3000`. Si se cambia el puerto
del backend, ajustar `frontend/vite.config.js`. Las credenciales de PostgreSQL
permanecen en el backend; no pertenecen a variables ni archivos del frontend.
El proxy de Vite sirve para desarrollo y vista previa; el despliegue necesita su
propia configuración de `/api` y `/media` (BF-020).

## Archivos para aprender

- `src/main.jsx`: monta React en el elemento `root` de `index.html`.
- `src/App.jsx`: pantalla, formulario y consulta al catálogo. `useState` conserva
  filtros/página; `useEffect` consulta cuando cambian y cancela peticiones anteriores.
- `src/styles.css`: colores, diseño y reglas para pantallas pequeñas.
- `src/Admin.jsx` y `src/admin.css`: panel gráfico accesible en `/admin`.
- `vite.config.js`: puerto local y proxy hacia Express.

El formulario aplica filtros al pulsar Buscar y vuelve a la página 1. Incluye
limpieza de filtros, navegación entre páginas y estados de carga/error/vacío.
Al elegir un tipo se muestran productos con una variante activa coincidente;
«Ver presentaciones» conserva todas las variantes activas del producto.
El precio «Desde» corresponde al tipo seleccionado cuando hay ese filtro activo.
Los importes se presentan como referencia USD; su formato visual no calcula Bs.

La portada y las tres inspiraciones usan imágenes provisionales de ImageGen,
documentadas en [recursos visuales](../documentacion/RECURSOS-VISUALES.md).
Las fotos reales usan la URL controlada que entrega el backend; no se interpreta
`clave_archivo` arbitrariamente como una URL.
Sin productos reales la pantalla muestra la colección en preparación, sin
inventar mercancía. Ficha completa, carrito y checkout son entregas posteriores.

El panel permite crear/editar perfumes y presentaciones, subir portada/logo,
publicar u ocultar y registrar entradas de inventario. Requiere aplicar 003 y crear
la primera cuenta. [Guía de activación y uso](../documentacion/PANEL-ADMINISTRACION.md).

## Comprobaciones

`npm --prefix frontend run build` genera `frontend/dist` (ignorado por Git).
La compilación y una respuesta HTTP no prueban por sí solas las interacciones ni
la apariencia: completar revisión visual en escritorio y móvil al tener navegador.

Referencias consultadas: [React](https://react.dev/learn/creating-a-react-app) y
[guía de Vite](https://vite.dev/guide/).
