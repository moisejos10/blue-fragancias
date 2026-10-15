# Administrar Blue Fragancias sin editar código

El panel está en http://127.0.0.1:5173/admin. Desde allí puedes crear perfumes,
editar precios, añadir presentaciones, cambiar fotos, publicar u ocultar productos,
registrar mercancía recibida y reemplazar el logo de la tienda.

## Preparación inicial: una sola vez

El panel está implementado y probado en una base temporal. Su activación en tu
base habitual sigue pendiente. Abre una terminal en la carpeta **Blue Fragancias**
y ejecuta:

```powershell
npm --prefix backend run admin:instalar
```

PostgreSQL pedirá la contraseña de su administrador `postgres`. Escríbela solo
en esa terminal. Este paso aplica la migración nueva 003, conservando las tablas
y los datos anteriores. El servidor de la tienda seguirá usando su rol limitado.

Cuando termine correctamente, ejecuta:

```powershell
npm --prefix backend run admin:crear
```

Elige tu nombre, correo y una contraseña nueva de 12 a 128 caracteres para el
panel. La contraseña se pide dos veces y no se muestra. Usa ese correo y esa
contraseña para iniciar sesión. El correo identifica la cuenta; todavía no hay
recuperación de acceso por email.

Si 003 ya fue aplicada, ejecuta solo `admin:crear`. Si ya existe un administrador,
el comando conservará esa cuenta. No vuelvas a ejecutar las migraciones 001/002.

Para iniciar la tienda en futuras sesiones, abre dos terminales en la raíz:

```powershell
npm --prefix backend run dev
```

```powershell
npm --prefix frontend run dev
```

Abre http://127.0.0.1:5173/admin. Una vez preparado, el trabajo cotidiano se hace
con los botones y formularios del panel.

## Añadir tu primer perfume

1. Entra a **Catálogo → Nuevo perfume**.
2. Escribe nombre, marca, descripción, género y familia olfativa.
3. Añade sus presentaciones: nombre, tipo, volumen, concentración y precio de
   referencia en USD. Puedes añadir frascos, decants o muestras.
4. Deja **Publicar en la tienda** desmarcado y pulsa **Guardar perfume** para
   preparar un borrador.
5. En **Foto de portada**, selecciona una imagen y describe lo que muestra.
   Pulsa **Guardar foto**.
6. En **Inventario**, registra las unidades recibidas de cada presentación y
   su motivo. Las unidades inicialmente son cero.
7. Marca **Publicar en la tienda** y guarda. Abre **Ver tienda** para comprobarlo.

Las imágenes JPG, PNG y WebP deben pesar como máximo 5 MB y ser estáticas, de
hasta 20 megapíxeles. Puedes reemplazar la portada seleccionando otro archivo.
Actualmente hay una portada por producto; galerías de varias fotos quedan para
una ampliación posterior.

## Actualizar productos y precios

Busca el perfume en **Catálogo**, pulsa **Editar**, cambia los datos y guarda.
Para ocultar un perfume, desmarca **Publicar en la tienda**. Para ocultar una
presentación, desmarca **Presentación visible**. Los registros se conservan.

El precio es la referencia USD acordada. Mostrar precios en Bs necesita completar
la fuente y vigencia EUR/VES. Los cambios del catálogo no modifican los precios
históricos que ya estén guardados en pedidos.

Si otra ventana cambió el producto, el panel pedirá recargarlo antes de guardar.
Guarda tus cambios antes de salir del editor o cambiar de sección.

## Recibir mercancía

En **Editar → Inventario**, indica las unidades nuevas y un motivo, y pulsa
**Registrar entrada**. Cada entrada añade unidades y conserva su historial.
Los reintentos de la misma entrada no duplican el saldo. Ajustes negativos,
reservas, ventas y devoluciones todavía pertenecen a entregas posteriores.

## Cambiar el logo

Entra a **Logo de la tienda**, selecciona el archivo y pulsa **Guardar logo**.
Para conservar la transparencia, usa PNG o WebP con fondo transparente. La página
mostrará el nuevo logo al recargarla.

## Qué está comprobado

Pruebas locales de backend y PostgreSQL temporal: acceso, permisos, sesiones,
guardado transaccional, publicación, inventario, fotos y logo. La compilación de
React también pasó. La revisión visual y los clics reales en escritorio/móvil
siguen pendientes por falta de navegador conectado en la sesión del agente.

## Notas técnicas para el despliegue

- Los archivos subidos quedan en `backend/storage/imagenes`, fuera de Git. Hay
  que respaldar esa carpeta junto con PostgreSQL y usar un volumen persistente.
- Cada sesión dura hasta 8 horas y verifica que la cuenta siga activa.
- En producción configurar `NODE_ENV=production`, HTTPS y `ADMIN_ORIGINS` con
  el origen exacto de la tienda. El proxy de desarrollo de Vite no es el servidor
  de publicación; el hosting debe reenviar `/api` y `/media` a Express.
- El límite de intentos usa memoria del proceso; varios servidores requerirán
  un limitador compartido. Restablecimiento de contraseña y cuentas adicionales
  siguen pendientes.

Referencias técnicas consultadas: [sesiones de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html),
[CSRF](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html),
[Multer](https://expressjs.com/en/resources/middleware/multer/),
[Argon2](https://www.npmjs.com/package/argon2) y [sharp](https://sharp.pixelplumbing.com/api-constructor/).
