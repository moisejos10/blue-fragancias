-- Blue Fragancias | Pruebas del esquema, solo en el servidor temporal.
-- Ejecutar desde la raiz: node backend/database/test-schema.cjs
-- Todos los nombres, importes, tasas y contactos son fixtures ficticios.
-- La tasa de ejemplo NO es una cotizacion real ni una fuente para la tienda.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path = public, pg_catalog;

-- Evitar cargar estos ejemplos en la base habitual, incluso si esta vacia.
DO $$
DECLARE
    tabla text;
    tiene_datos boolean;
BEGIN
    IF current_user <> 'bf_schema_test'
       OR current_database() <> 'blue_fragancias'
       OR replace(current_setting('data_directory'), chr(92), '/')
          NOT LIKE '%/.tmp/postgres-schema-%/data' THEN
        RAISE EXCEPTION 'Usa test-schema.cjs: estas pruebas requieren su servidor temporal';
    END IF;
    FOR tabla IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I)', tabla) INTO tiene_datos;
        IF tiene_datos THEN
            RAISE EXCEPTION 'Las pruebas requieren tablas vacias: % contiene datos', tabla;
        END IF;
    END LOOP;
END;
$$;

-- Ayudantes de esta sesion: no forman parte del esquema de la tienda.
CREATE TEMP TABLE resultados_pruebas (caso text NOT NULL) ON COMMIT DROP;

CREATE FUNCTION pg_temp.comprobar(condicion boolean, caso text) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
    IF condicion IS DISTINCT FROM true THEN
        RAISE EXCEPTION 'FALLO: %', caso;
    END IF;
    INSERT INTO pg_temp.resultados_pruebas VALUES (caso);
END;
$$;

CREATE FUNCTION pg_temp.esperar_error(sentencia text, codigo text, caso text) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
    recibido text;
    mensaje text;
BEGIN
    -- EXCEPTION revierte solo el intento: ni la fila ni sus triggers dejan cambios.
    BEGIN
        EXECUTE sentencia;
        -- Tambien detecta las restricciones diferidas de cabecera/detalle.
        SET CONSTRAINTS ALL IMMEDIATE;
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS recibido = RETURNED_SQLSTATE, mensaje = MESSAGE_TEXT;
        IF recibido <> codigo THEN
            RAISE EXCEPTION 'FALLO: %. Esperado %, recibido %: %', caso, codigo, recibido, mensaje;
        END IF;
        INSERT INTO pg_temp.resultados_pruebas VALUES (caso);
        RETURN;
    END;
    -- Fuera del bloque que captura: nuestro propio fallo nunca cuenta como exito.
    RAISE EXCEPTION 'FALLO: %. La operacion debia rechazar SQLSTATE %', caso, codigo;
END;
$$;

-- 1. Catalogo minimo. Crear las dos variantes antes de ensayar INSERT fallidos:
-- las secuencias consumen numeros incluso cuando una operacion se revierte.
INSERT INTO administradores (id, nombre, email, hash_password) VALUES
('00000000-0000-0000-0000-000000000001', 'Administrador de prueba',
 'pruebas@example.invalid', '$argon2id$fixture-no-valido-para-autenticacion');
INSERT INTO marcas (nombre) VALUES ('Marca de prueba');
INSERT INTO productos (marca_id, nombre, slug, genero) VALUES
(1, 'Perfume de prueba', 'perfume-de-prueba', 'unisex');
INSERT INTO variantes_producto
    (producto_id, sku, presentacion, tipo_presentacion, volumen_ml, precio_ref_usd) VALUES
(1, 'PRUEBA-50', 'Frasco de prueba 50 ml', 'frasco', 50, 19.99),
(1, 'PRUEBA-10', 'Presentacion de prueba 10 ml', 'muestra', 10, 10.00);
INSERT INTO imagenes_producto (producto_id, clave_archivo, texto_alternativo) VALUES
(1, 'fixtures/perfume.webp', 'Imagen ficticia del perfume');
INSERT INTO tasas_cambio (tasa_eur_ves, fecha_vigencia, fuente, origen, registrada_por) VALUES
(36.123456, DATE '2000-01-01', 'Fixture sintetico; no es una tasa de mercado', 'manual',
 '00000000-0000-0000-0000-000000000001');

SELECT pg_temp.comprobar(
    (SELECT count(*) = 2 AND bool_and(stock_fisico = 0 AND stock_reservado = 0)
     FROM variantes_producto), 'Las variantes comienzan sin existencias');
SELECT pg_temp.comprobar(
    (SELECT sku = 'PRUEBA-10' FROM variantes_producto WHERE id = 2),
    'La variante 2 queda identificada para la prueba concurrente');

-- 2. Cinco pedidos con sus lineas dentro de la misma transaccion.
-- Los UUID ...021 y ...022 y la variante 2 son el contrato con test-schema.cjs.
INSERT INTO pedidos (id, clave_idempotencia, nombre_cliente, telefono_cliente,
    modalidad_entrega, direccion_entrega, metodo_pago_preferido, tasa_cambio_id,
    tasa_eur_ves, subtotal_ref_usd, costo_entrega_ref_usd) VALUES
('00000000-0000-0000-0000-000000000011', gen_random_uuid(), 'Cliente de prueba A',
 '+580000000000', 'delivery', 'Direccion ficticia A', 'pago_movil', 1, 36.123456, 39.98, 4.50),
('00000000-0000-0000-0000-000000000012', gen_random_uuid(), 'Cliente de prueba B',
 '+580000000000', 'envio_nacional', 'Direccion ficticia B', 'binance_pay', 1, 36.123456, 19.99, NULL),
('00000000-0000-0000-0000-000000000013', gen_random_uuid(), 'Cliente de prueba C',
 '+580000000000', 'pickup', NULL, 'efectivo', 1, 36.123456, 19.99, 0),
('00000000-0000-0000-0000-000000000021', gen_random_uuid(), 'Cliente de prueba D',
 '+580000000000', 'pickup', NULL, 'efectivo', 1, 36.123456, 10.00, 0),
('00000000-0000-0000-0000-000000000022', gen_random_uuid(), 'Cliente de prueba E',
 '+580000000000', 'pickup', NULL, 'efectivo', 1, 36.123456, 10.00, 0);
INSERT INTO detalle_pedidos
    (pedido_id, variante_id, sku, nombre_producto, presentacion, cantidad, precio_unitario_ref_usd)
SELECT p.id, v.id, v.sku, pr.nombre, v.presentacion,
       CASE WHEN p.id = '00000000-0000-0000-0000-000000000011' THEN 2 ELSE 1 END,
       v.precio_ref_usd
FROM pedidos p
JOIN variantes_producto v ON v.id = CASE
    WHEN p.id IN ('00000000-0000-0000-0000-000000000021',
                 '00000000-0000-0000-0000-000000000022') THEN 2 ELSE 1 END
JOIN productos pr ON pr.id = v.producto_id;
SET CONSTRAINTS ALL IMMEDIATE;
SET CONSTRAINTS ALL DEFERRED;

SELECT pg_temp.comprobar(
    (SELECT total_ref_usd = 44.48 AND total_ves = 1606.77 FROM pedidos
     WHERE id = '00000000-0000-0000-0000-000000000011'),
    'Total incluye entrega y aplica EUR/VES con redondeo final');
SELECT pg_temp.comprobar(
    (SELECT total_ref_usd IS NULL AND total_ves IS NULL FROM pedidos
     WHERE id = '00000000-0000-0000-0000-000000000012'),
    'Entrega pendiente mantiene ambos totales pendientes');
SELECT pg_temp.comprobar(
    (SELECT total_ref_usd = 19.99 AND total_ves = 722.11 FROM pedidos
     WHERE id = '00000000-0000-0000-0000-000000000013'), 'Pickup aplica costo cero');
SELECT pg_temp.comprobar(
    (SELECT count(*) = 5 AND bool_and(estado_anterior IS NULL
     AND estado_nuevo = 'pendiente_confirmacion') FROM historial_pedidos),
    'Cada pedido genera su historial inicial');

-- 3. Datos invalidos, duplicados, relaciones y subtotal diferido.
SELECT pg_temp.esperar_error($q$INSERT INTO marcas (nombre) VALUES ('MARCA DE PRUEBA')$q$,
    '23505', 'Marca duplicada aunque cambien las mayusculas');
SELECT pg_temp.esperar_error($q$UPDATE productos SET slug = 'Slug Invalido' WHERE id = 1$q$,
    '23514', 'Slug invalido');
SELECT pg_temp.esperar_error($q$UPDATE variantes_producto SET sku = 'PRUEBA-50' WHERE id = 2$q$,
    '23505', 'SKU duplicado');
SELECT pg_temp.esperar_error($q$UPDATE variantes_producto SET precio_ref_usd = 0 WHERE id = 1$q$,
    '23514', 'Precio cero');
SELECT pg_temp.esperar_error($q$UPDATE variantes_producto SET precio_ref_usd = 'NaN' WHERE id = 1$q$,
    '23514', 'Precio NaN');
SELECT pg_temp.esperar_error($q$UPDATE variantes_producto SET volumen_ml = -1 WHERE id = 1$q$,
    '23514', 'Volumen negativo');
SELECT pg_temp.esperar_error($q$INSERT INTO imagenes_producto
    (producto_id, clave_archivo, texto_alternativo) VALUES (1, 'fixtures/otra.webp', 'Otra')$q$,
    '23505', 'Dos imagenes no ocupan el mismo orden del producto');
SELECT pg_temp.esperar_error($q$DELETE FROM productos WHERE id = 1$q$,
    '23001', 'Un producto con presentaciones conserva sus relaciones (RESTRICT)');
SELECT pg_temp.esperar_error($q$INSERT INTO tasas_cambio
    (tasa_eur_ves, fecha_vigencia, fuente, origen) VALUES (1, '2000-01-01', 'Fixture', 'manual')$q$,
    '23514', 'Tasa manual requiere administrador');
SELECT pg_temp.esperar_error($q$INSERT INTO tasas_cambio
    (tasa_eur_ves, fecha_vigencia, fuente, origen) VALUES ('NaN', '2000-01-01', 'Fixture', 'api')$q$,
    '23514', 'Tasa NaN');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET tasa_eur_ves = 99
    WHERE id = '00000000-0000-0000-0000-000000000011'$q$,
    '23503', 'El valor historico debe corresponder al registro de tasa');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET clave_idempotencia =
    (SELECT clave_idempotencia FROM pedidos WHERE id = '00000000-0000-0000-0000-000000000011')
    WHERE id = '00000000-0000-0000-0000-000000000012'$q$,
    '23505', 'Un reintento no duplica la clave del pedido');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET direccion_entrega = NULL
    WHERE id = '00000000-0000-0000-0000-000000000011'$q$, '23514', 'Delivery requiere direccion');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET estado = 'confirmado'
    WHERE id = '00000000-0000-0000-0000-000000000012'$q$, '23514', 'Confirmar requiere cotizar entrega');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET costo_entrega_ref_usd = NULL
    WHERE id = '00000000-0000-0000-0000-000000000013'$q$, '23514', 'Pickup requiere costo cero explicito');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET estado = 'enviado'
    WHERE id = '00000000-0000-0000-0000-000000000013'$q$, '23514', 'Pickup no se marca enviado');
SELECT pg_temp.esperar_error($q$UPDATE pedidos SET estado = 'listo_retiro'
    WHERE id = '00000000-0000-0000-0000-000000000011'$q$, '23514', 'Delivery no se marca listo para retiro');
SELECT pg_temp.esperar_error($q$UPDATE detalle_pedidos SET cantidad = 0
    WHERE pedido_id = '00000000-0000-0000-0000-000000000011'$q$, '23514', 'Cantidad cero');
SELECT pg_temp.esperar_error($q$UPDATE detalle_pedidos SET cantidad = 3
    WHERE pedido_id = '00000000-0000-0000-0000-000000000011'$q$, '23514', 'Cambio de linea exige subtotal coherente');
SELECT pg_temp.esperar_error($q$DELETE FROM detalle_pedidos
    WHERE pedido_id = '00000000-0000-0000-0000-000000000013'$q$, '23514', 'Pedido sin lineas no puede persistir');
SELECT pg_temp.comprobar(
    (SELECT cantidad = 2 AND total_linea_ref_usd = 39.98 FROM detalle_pedidos
     WHERE pedido_id = '00000000-0000-0000-0000-000000000011'), 'Un detalle fallido conserva sus valores');

UPDATE pedidos SET costo_entrega_ref_usd = 2, estado = 'confirmado',
    actualizado_por = '00000000-0000-0000-0000-000000000001'
WHERE id = '00000000-0000-0000-0000-000000000012';
SELECT pg_temp.comprobar(
    (SELECT total_ref_usd = 21.99 AND total_ves = 794.35 FROM pedidos
     WHERE id = '00000000-0000-0000-0000-000000000012'), 'Cotizar entrega permite confirmar y recalcula totales');
UPDATE pedidos SET estado = 'confirmado', notas_cliente = 'Nota ficticia'
WHERE id = '00000000-0000-0000-0000-000000000012';
SELECT pg_temp.comprobar(
    (SELECT count(*) = 2 FROM historial_pedidos
     WHERE pedido_id = '00000000-0000-0000-0000-000000000012')
    AND EXISTS (SELECT 1 FROM historial_pedidos
     WHERE pedido_id = '00000000-0000-0000-0000-000000000012'
       AND estado_anterior = 'pendiente_confirmacion' AND estado_nuevo = 'confirmado'
       AND administrador_id = '00000000-0000-0000-0000-000000000001'),
    'Historial conserva autor y transicion, sin duplicar un estado repetido');

-- 4. Los datos copiados al pedido sobreviven a cambios posteriores del catalogo.
UPDATE productos SET nombre = 'Perfume renombrado' WHERE id = 1;
UPDATE variantes_producto SET sku = 'PRUEBA-NUEVO', presentacion = 'Presentacion renombrada',
    precio_ref_usd = 25 WHERE id = 1;
SELECT pg_temp.comprobar(
    (SELECT sku = 'PRUEBA-50' AND nombre_producto = 'Perfume de prueba'
       AND presentacion = 'Frasco de prueba 50 ml' AND precio_unitario_ref_usd = 19.99
       AND total_linea_ref_usd = 39.98 FROM detalle_pedidos
     WHERE pedido_id = '00000000-0000-0000-0000-000000000011'),
    'El detalle conserva nombre, SKU, presentacion y precio originales');
SELECT pg_temp.comprobar(
    (SELECT subtotal_ref_usd = 39.98 AND tasa_eur_ves = 36.123456 AND total_ves = 1606.77
     FROM pedidos WHERE id = '00000000-0000-0000-0000-000000000011'),
    'Editar el catalogo conserva los importes historicos del pedido');
SELECT pg_temp.esperar_error($q$UPDATE tasas_cambio SET tasa_eur_ves = 40 WHERE id = 1$q$,
    'P0001', 'Las tasas historicas no se editan');
SELECT pg_temp.esperar_error($q$DELETE FROM tasas_cambio WHERE id = 1$q$,
    'P0001', 'Las tasas historicas no se borran');
SELECT pg_temp.esperar_error($q$UPDATE historial_pedidos SET estado_nuevo = 'cancelado'$q$,
    'P0001', 'El historial de estados no se edita');
SELECT pg_temp.esperar_error($q$DELETE FROM historial_pedidos$q$,
    'P0001', 'El historial de estados no se borra');

-- 5. Pagos: moneda recibida, precision, duplicados y revision manual.
INSERT INTO pagos (id, pedido_id, clave_idempotencia, metodo, moneda, monto,
    fecha_operacion, referencia_operacion, banco_origen, banco_destino, telefono_pagador) VALUES
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000011',
 gen_random_uuid(), 'pago_movil', 'VES', 1606.77, '2000-01-01', 'PRUEBA-PM-001', '0001', '0002', '+580000000000'),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000012',
 gen_random_uuid(), 'binance_pay', 'USDT', 1.12345678, '2000-01-01', 'PRUEBA-BP-001', NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000013',
 gen_random_uuid(), 'efectivo', 'USD', 10.99, '2000-01-01', NULL, NULL, NULL, NULL);
SELECT pg_temp.comprobar(
    (SELECT count(*) = 3 AND bool_and(estado = 'reportado') FROM pagos), 'Los pagos comienzan reportados');
SELECT pg_temp.comprobar(
    (SELECT moneda = 'USDT' AND monto = 1.12345678 FROM pagos
     WHERE id = '00000000-0000-0000-0000-000000000042'), 'Binance conserva moneda y ocho decimales');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET moneda = 'USD'
    WHERE id = '00000000-0000-0000-0000-000000000041'$q$, '23514', 'Pago Movil requiere VES');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET banco_origen = NULL
    WHERE id = '00000000-0000-0000-0000-000000000041'$q$, '23514', 'Pago Movil requiere datos bancarios');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET referencia_operacion = NULL
    WHERE id = '00000000-0000-0000-0000-000000000042'$q$, '23514', 'Binance requiere referencia');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET moneda = 'USDT'
    WHERE id = '00000000-0000-0000-0000-000000000043'$q$, '23514', 'Efectivo admite solo monedas acordadas');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET monto = 1.001
    WHERE id = '00000000-0000-0000-0000-000000000043'$q$, '23514', 'Efectivo admite como maximo dos decimales');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET monto = 'NaN'
    WHERE id = '00000000-0000-0000-0000-000000000042'$q$, '23514', 'Pago NaN');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET clave_idempotencia =
    (SELECT clave_idempotencia FROM pagos WHERE id = '00000000-0000-0000-0000-000000000041')
    WHERE id = '00000000-0000-0000-0000-000000000042'$q$, '23505', 'Idempotencia de pagos');
SELECT pg_temp.esperar_error($q$INSERT INTO pagos (pedido_id, clave_idempotencia,
    metodo, moneda, monto, fecha_operacion, referencia_operacion)
    VALUES ('00000000-0000-0000-0000-000000000013', gen_random_uuid(), 'binance_pay',
    'USDT', 1, '2000-01-01', 'PRUEBA-BP-001')$q$, '23505', 'Referencia Binance activa duplicada');
SELECT pg_temp.esperar_error($q$INSERT INTO pagos (pedido_id, clave_idempotencia, metodo,
    moneda, monto, fecha_operacion, referencia_operacion, banco_origen, banco_destino, telefono_pagador)
    SELECT pedido_id, gen_random_uuid(), metodo, moneda, monto, fecha_operacion,
    referencia_operacion, banco_origen, banco_destino, telefono_pagador FROM pagos
    WHERE id = '00000000-0000-0000-0000-000000000041'$q$, '23505', 'Misma operacion de Pago Movil duplicada');
INSERT INTO pagos (pedido_id, clave_idempotencia, metodo, moneda, monto, fecha_operacion,
    referencia_operacion, banco_origen, banco_destino, telefono_pagador)
SELECT pedido_id, gen_random_uuid(), metodo, moneda, monto, fecha_operacion,
    referencia_operacion, '0003', banco_destino, telefono_pagador FROM pagos
WHERE id = '00000000-0000-0000-0000-000000000041';
SELECT pg_temp.comprobar(
    (SELECT count(*) = 2 FROM pagos WHERE metodo = 'pago_movil' AND referencia_operacion = 'PRUEBA-PM-001'),
    'El numero de referencia puede coincidir si cambia el banco de origen');
SELECT pg_temp.esperar_error($q$UPDATE pagos SET estado = 'verificado'
    WHERE id = '00000000-0000-0000-0000-000000000041'$q$, '23514', 'Verificar requiere administrador y fecha');
UPDATE pagos SET estado = 'verificado', revisado_por = '00000000-0000-0000-0000-000000000001',
    revisado_en = now() WHERE id = '00000000-0000-0000-0000-000000000041';
SELECT pg_temp.esperar_error($q$UPDATE pagos SET estado = 'rechazado',
    revisado_por = '00000000-0000-0000-0000-000000000001', revisado_en = now()
    WHERE id = '00000000-0000-0000-0000-000000000042'$q$, '23514', 'Rechazar requiere motivo');
UPDATE pagos SET estado = 'rechazado', revisado_por = '00000000-0000-0000-0000-000000000001',
    revisado_en = now(), motivo_rechazo = 'Rechazo ficticio para probar el indice'
WHERE id = '00000000-0000-0000-0000-000000000042';
INSERT INTO pagos (pedido_id, clave_idempotencia, metodo, moneda, monto, fecha_operacion, referencia_operacion)
VALUES ('00000000-0000-0000-0000-000000000012', gen_random_uuid(), 'binance_pay',
    'USDT', 1.12345678, '2000-01-01', 'PRUEBA-BP-001');
SELECT pg_temp.comprobar(
    (SELECT count(*) = 2 FROM pagos WHERE referencia_operacion = 'PRUEBA-BP-001'),
    'Referencia rechazada permite registrar otro reporte sin borrar el anterior');
SELECT pg_temp.comprobar(
    (SELECT estado = 'pendiente_confirmacion' FROM pedidos
     WHERE id = '00000000-0000-0000-0000-000000000011'), 'Revisar un pago no confirma automaticamente el pedido');

-- 6. Existencias solo mediante movimientos. La variante 2 se deja libre para el runner.
INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id) VALUES
('00000000-0000-0000-0000-000000000051', 1, 'entrada', 10, 'Entrada ficticia', '00000000-0000-0000-0000-000000000001'),
('00000000-0000-0000-0000-000000000052', 2, 'entrada', 1, 'Ultima unidad ficticia', '00000000-0000-0000-0000-000000000001');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 0 FROM variantes_producto WHERE id = 1),
    'Entrada aplica el saldo fisico');
INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo) VALUES
('00000000-0000-0000-0000-000000000053', 1, '00000000-0000-0000-0000-000000000011', 'reserva', 2, 'Reserva ficticia A'),
('00000000-0000-0000-0000-000000000054', 1, '00000000-0000-0000-0000-000000000012', 'reserva', 1, 'Reserva ficticia B');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 3 FROM variantes_producto WHERE id = 1),
    'Reserva reduce disponibilidad sin reducir existencia fisica');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
    VALUES ('00000000-0000-0000-0000-000000000053', 1, '00000000-0000-0000-0000-000000000011',
    'reserva', 2, 'Reintento ficticio')$q$, '23505', 'Idempotencia de movimientos');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000011', 'reserva', 1, 'Exceso ficticio')$q$,
    '23514', 'No reservar mas unidades que las del detalle aunque haya stock');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000013', 'liberacion', -1, 'Reserva ajena')$q$,
    '23514', 'No liberar la reserva de otro pedido');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_fisico, cambio_reservado, motivo)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000013', 'venta', -1, -1, 'Reserva ajena')$q$,
    '23514', 'No vender la reserva de otro pedido');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_fisico, motivo, administrador_id)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000013', 'devolucion', 1,
    'Sin venta', '00000000-0000-0000-0000-000000000001')$q$, '23514', 'No devolver unidades que no se vendieron');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id)
    VALUES (gen_random_uuid(), 1, 'ajuste', -20, 'Saldo negativo', '00000000-0000-0000-0000-000000000001')$q$,
    '23514', 'No dejar existencias negativas');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id)
    VALUES (gen_random_uuid(), 1, 'ajuste', -8, 'Fisico menor que reservado',
    '00000000-0000-0000-0000-000000000001')$q$,
    '23514', 'Un ajuste no puede dejar dos unidades fisicas cuando hay tres reservadas');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000021', 'reserva', 1, 'Variante ajena')$q$,
    '23503', 'El movimiento debe corresponder a una variante del pedido');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo)
    VALUES (gen_random_uuid(), 1, 'entrada', 1, 'Sin administrador')$q$,
    '23514', 'Entrada requiere administrador');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 3 FROM variantes_producto WHERE id = 1)
    AND (SELECT count(*) = 3 FROM movimientos_inventario WHERE variante_id = 1),
    'Intentos rechazados revierten tanto el movimiento como sus efectos en stock');

INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000011', 'liberacion', -1, 'Liberacion propia');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 2 FROM variantes_producto WHERE id = 1),
    'Liberacion propia conserva fisico y reduce reservado');
INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_fisico, cambio_reservado, motivo)
VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000011', 'venta', -1, -1, 'Venta propia');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 9 AND stock_reservado = 1 FROM variantes_producto WHERE id = 1),
    'Venta consume fisico y reserva propios');
INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_fisico, motivo, administrador_id)
VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000011', 'devolucion', 1,
    'Devolucion propia', '00000000-0000-0000-0000-000000000001');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 1 FROM variantes_producto WHERE id = 1),
    'Devolucion repone una venta sin crear reservas');
SELECT pg_temp.esperar_error($q$INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_fisico, motivo, administrador_id)
    VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000011', 'devolucion', 1,
    'Segunda devolucion', '00000000-0000-0000-0000-000000000001')$q$,
    '23514', 'No devolver dos veces la misma unidad vendida');
SELECT pg_temp.esperar_error($q$UPDATE movimientos_inventario SET motivo = 'Edicion'$q$,
    'P0001', 'Los movimientos no se editan');
SELECT pg_temp.esperar_error($q$DELETE FROM movimientos_inventario$q$,
    'P0001', 'Los movimientos no se borran');
INSERT INTO movimientos_inventario
    (clave_idempotencia, variante_id, pedido_id, tipo, cambio_reservado, motivo)
VALUES (gen_random_uuid(), 1, '00000000-0000-0000-0000-000000000012', 'liberacion', -1, 'Liberacion propia B');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 10 AND stock_reservado = 0 FROM variantes_producto WHERE id = 1),
    'Ciclo de inventario deja saldos esperados');

-- Comprobar el contrato para las pruebas adicionales del ejecutor de Node.
SELECT pg_temp.comprobar((SELECT count(*) = 5 FROM pedidos), 'Quedan exactamente cinco pedidos de prueba');
SELECT pg_temp.comprobar(
    (SELECT subtotal_ref_usd = 10.00 FROM pedidos WHERE id = '00000000-0000-0000-0000-000000000021')
    AND (SELECT count(*) = 2 FROM detalle_pedidos WHERE variante_id = 2 AND cantidad = 1
     AND pedido_id IN ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022')),
    'Ambos pedidos concurrentes contienen una unidad de la variante 2');
SELECT pg_temp.comprobar(
    (SELECT stock_fisico = 1 AND stock_reservado = 0 FROM variantes_producto WHERE id = 2)
    AND NOT EXISTS (SELECT 1 FROM movimientos_inventario WHERE variante_id = 2 AND tipo = 'reserva'),
    'Ultima unidad queda libre y sin reservas anteriores para la concurrencia');
SET CONSTRAINTS ALL IMMEDIATE;
SELECT count(*) AS comprobaciones_sql_correctas FROM pg_temp.resultados_pruebas;
COMMIT;
\echo Pruebas SQL completadas; fixtures listos para las comprobaciones del ejecutor.
