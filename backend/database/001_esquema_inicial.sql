-- Blue Fragancias | PostgreSQL 18 | Migracion inicial, ejecutar una sola vez.
-- Si algo falla, la transaccion completa se revierte. No contiene datos ficticios.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path = public, pg_catalog;

DO $$
BEGIN
    IF current_database() <> 'blue_fragancias' THEN
        RAISE EXCEPTION 'Conectate a blue_fragancias antes de ejecutar esta migracion';
    END IF;
END;
$$;

-- 1. Unicamente el personal inicia sesion. Los compradores son invitados.
CREATE TABLE administradores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre varchar(120) NOT NULL CHECK (btrim(nombre) <> ''),
    email varchar(254) NOT NULL UNIQUE
        CHECK (email = lower(btrim(email)) AND position('@' IN email) > 1),
    hash_password text NOT NULL CHECK (hash_password LIKE '$argon2id$%'),
    activo boolean NOT NULL DEFAULT true,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- 2-5. Un perfume puede tener varias presentaciones, precios y existencias.
CREATE TABLE marcas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(100) NOT NULL CHECK (nombre = btrim(nombre) AND nombre <> ''),
    creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX marcas_nombre_unico ON marcas (lower(nombre));

CREATE TABLE productos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    marca_id bigint NOT NULL REFERENCES marcas(id) ON DELETE RESTRICT,
    nombre varchar(180) NOT NULL CHECK (btrim(nombre) <> ''),
    slug varchar(220) NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
    descripcion text NOT NULL DEFAULT '',
    genero varchar(15) CHECK (genero IN ('femenino', 'masculino', 'unisex')),
    familia_olfativa varchar(80),
    activo boolean NOT NULL DEFAULT false,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX productos_marca_idx ON productos (marca_id);
CREATE INDEX productos_catalogo_idx ON productos (genero, id) WHERE activo;

CREATE TABLE variantes_producto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id bigint NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    sku varchar(60) NOT NULL UNIQUE CHECK (sku = upper(btrim(sku)) AND sku <> ''),
    presentacion varchar(120) NOT NULL CHECK (btrim(presentacion) <> ''),
    tipo_presentacion varchar(15) NOT NULL
        CHECK (tipo_presentacion IN ('frasco', 'decant', 'muestra')),
    concentracion varchar(40),
    volumen_ml numeric(8,2) NOT NULL CHECK (volumen_ml > 0 AND volumen_ml <> 'NaN'::numeric),
    precio_ref_usd numeric(12,2) NOT NULL
        CHECK (precio_ref_usd > 0 AND precio_ref_usd <> 'NaN'::numeric),
    stock_fisico integer NOT NULL DEFAULT 0 CHECK (stock_fisico >= 0),
    stock_reservado integer NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT stock_reservado_valido CHECK (stock_reservado BETWEEN 0 AND stock_fisico)
);
CREATE INDEX variantes_producto_producto_idx ON variantes_producto (producto_id);
CREATE INDEX variantes_producto_precio_idx ON variantes_producto (precio_ref_usd, id) WHERE activo;

CREATE TABLE imagenes_producto (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    producto_id bigint NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    clave_archivo text NOT NULL CHECK (btrim(clave_archivo) <> ''),
    texto_alternativo varchar(250) NOT NULL CHECK (btrim(texto_alternativo) <> ''),
    orden integer NOT NULL DEFAULT 0 CHECK (orden >= 0),
    creado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE (producto_id, orden)
);

-- 6. Historial inmutable: una correccion o nueva cotizacion es otra fila.
-- La tasa es EUR/VES; el precio base es una referencia comercial USD.
CREATE TABLE tasas_cambio (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tasa_eur_ves numeric(18,6) NOT NULL
        CHECK (tasa_eur_ves > 0 AND tasa_eur_ves <> 'NaN'::numeric),
    fecha_vigencia date NOT NULL,
    fuente text NOT NULL CHECK (btrim(fuente) <> ''),
    origen varchar(10) NOT NULL CHECK (origen IN ('api', 'manual')),
    consultada_en timestamptz NOT NULL DEFAULT now(),
    registrada_por uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    CHECK (origen <> 'manual' OR registrada_por IS NOT NULL),
    UNIQUE (id, tasa_eur_ves)
);
CREATE INDEX tasas_cambio_vigencia_idx ON tasas_cambio (fecha_vigencia DESC, consultada_en DESC);

-- 7. Pedido de invitado. NULL en costo de entrega significa "por confirmar".
-- Abrir WhatsApp no cambia el estado del pedido ni acredita un pago.
CREATE TABLE pedidos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    clave_idempotencia uuid NOT NULL UNIQUE,
    nombre_cliente varchar(120) NOT NULL CHECK (btrim(nombre_cliente) <> ''),
    telefono_cliente varchar(16) NOT NULL CHECK (telefono_cliente ~ '^\+[1-9][0-9]{7,14}$'),
    email_cliente varchar(254),
    modalidad_entrega varchar(20) NOT NULL
        CHECK (modalidad_entrega IN ('envio_nacional', 'delivery', 'pickup')),
    direccion_entrega text,
    metodo_pago_preferido varchar(15) NOT NULL
        CHECK (metodo_pago_preferido IN ('pago_movil', 'binance_pay', 'efectivo')),
    estado varchar(25) NOT NULL DEFAULT 'pendiente_confirmacion'
        CHECK (estado IN ('pendiente_confirmacion', 'confirmado', 'preparando',
                          'enviado', 'listo_retiro', 'entregado', 'cancelado')),
    tasa_cambio_id bigint NOT NULL,
    tasa_eur_ves numeric(18,6) NOT NULL,
    subtotal_ref_usd numeric(14,2) NOT NULL
        CHECK (subtotal_ref_usd > 0 AND subtotal_ref_usd <> 'NaN'::numeric),
    costo_entrega_ref_usd numeric(12,2)
        CHECK (costo_entrega_ref_usd >= 0 AND costo_entrega_ref_usd <> 'NaN'::numeric),
    total_ref_usd numeric(15,2) GENERATED ALWAYS AS
        (subtotal_ref_usd + costo_entrega_ref_usd) STORED,
    total_ves numeric(30,2) GENERATED ALWAYS AS
        (round((subtotal_ref_usd + costo_entrega_ref_usd) * tasa_eur_ves, 2)) STORED,
    notas_cliente text,
    reserva_hasta timestamptz,
    actualizado_por uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (tasa_cambio_id, tasa_eur_ves)
        REFERENCES tasas_cambio(id, tasa_eur_ves) ON DELETE RESTRICT,
    CONSTRAINT entrega_direccion_requerida CHECK (
        modalidad_entrega = 'pickup'
        OR (direccion_entrega IS NOT NULL AND btrim(direccion_entrega) <> '')
    ),
    CONSTRAINT pickup_sin_costo CHECK (
        modalidad_entrega <> 'pickup'
        OR (costo_entrega_ref_usd IS NOT NULL AND costo_entrega_ref_usd = 0)
    ),
    CONSTRAINT pedido_confirmado_con_costo CHECK (
        estado IN ('pendiente_confirmacion', 'cancelado') OR costo_entrega_ref_usd IS NOT NULL
    ),
    CONSTRAINT estado_entrega_coherente CHECK (
        (estado <> 'listo_retiro' OR modalidad_entrega = 'pickup')
        AND (estado <> 'enviado' OR modalidad_entrega <> 'pickup')
    ),
    CHECK (reserva_hasta IS NULL OR reserva_hasta > creado_en)
);
CREATE INDEX pedidos_estado_fecha_idx ON pedidos (estado, creado_en DESC);
CREATE INDEX pedidos_tasa_idx ON pedidos (tasa_cambio_id, tasa_eur_ves);
CREATE INDEX pedidos_reserva_idx ON pedidos (reserva_hasta) WHERE reserva_hasta IS NOT NULL;

-- 8. Snapshots: cambiar el catalogo no cambia el detalle de una venta.
CREATE TABLE detalle_pedidos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    variante_id bigint NOT NULL REFERENCES variantes_producto(id) ON DELETE RESTRICT,
    sku varchar(60) NOT NULL CHECK (btrim(sku) <> ''),
    nombre_producto varchar(180) NOT NULL CHECK (btrim(nombre_producto) <> ''),
    presentacion varchar(120) NOT NULL CHECK (btrim(presentacion) <> ''),
    cantidad integer NOT NULL CHECK (cantidad BETWEEN 1 AND 10000),
    precio_unitario_ref_usd numeric(12,2) NOT NULL
        CHECK (precio_unitario_ref_usd > 0 AND precio_unitario_ref_usd <> 'NaN'::numeric),
    total_linea_ref_usd numeric(16,2) GENERATED ALWAYS AS
        (cantidad * precio_unitario_ref_usd) STORED,
    UNIQUE (pedido_id, variante_id)
);
CREATE INDEX detalle_pedidos_variante_idx ON detalle_pedidos (variante_id);

-- 9. Se guarda la moneda REAL del pago. USD, USDT y EUR son diferentes.
-- No se suman pagos de distintas monedas sin una regla de conciliacion.
CREATE TABLE pagos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    clave_idempotencia uuid NOT NULL UNIQUE,
    metodo varchar(15) NOT NULL CHECK (metodo IN ('pago_movil', 'binance_pay', 'efectivo')),
    moneda varchar(10) NOT NULL CHECK (moneda ~ '^[A-Z][A-Z0-9]{1,9}$'),
    monto numeric(20,8) NOT NULL CHECK (monto > 0 AND monto <> 'NaN'::numeric),
    fecha_operacion date NOT NULL,
    referencia_operacion varchar(150),
    banco_origen varchar(4),
    banco_destino varchar(4),
    telefono_pagador varchar(16),
    comprobante_clave_privada text,
    estado varchar(12) NOT NULL DEFAULT 'reportado'
        CHECK (estado IN ('reportado', 'verificado', 'rechazado')),
    registrado_por uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    revisado_por uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    revisado_en timestamptz,
    motivo_rechazo text,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    CHECK (referencia_operacion IS NULL OR
           (referencia_operacion = btrim(referencia_operacion) AND referencia_operacion <> '')),
    CHECK (metodo = 'efectivo' OR referencia_operacion IS NOT NULL),
    CHECK (metodo <> 'pago_movil' OR (
        moneda = 'VES'
        AND banco_origen IS NOT NULL AND banco_origen ~ '^[0-9]{4}$'
        AND banco_destino IS NOT NULL AND banco_destino ~ '^[0-9]{4}$'
        AND telefono_pagador IS NOT NULL AND telefono_pagador ~ '^\+[1-9][0-9]{7,14}$'
    )),
    CHECK (metodo <> 'efectivo' OR moneda IN ('USD', 'VES', 'EUR')),
    CHECK (metodo = 'binance_pay' OR monto = round(monto, 2)),
    CONSTRAINT pago_revision_requerida CHECK (
        (estado = 'reportado' AND revisado_por IS NULL AND revisado_en IS NULL)
        OR (estado IN ('verificado', 'rechazado') AND revisado_por IS NOT NULL AND revisado_en IS NOT NULL)
    ),
    CHECK (estado <> 'rechazado' OR (motivo_rechazo IS NOT NULL AND btrim(motivo_rechazo) <> ''))
);
CREATE INDEX pagos_pedido_idx ON pagos (pedido_id, creado_en DESC);
CREATE INDEX pagos_revision_idx ON pagos (creado_en) WHERE estado = 'reportado';
CREATE UNIQUE INDEX pagos_binance_operacion_unica ON pagos (referencia_operacion)
    WHERE metodo = 'binance_pay' AND estado <> 'rechazado';
CREATE UNIQUE INDEX pagos_movil_operacion_unica ON pagos
    (banco_origen, banco_destino, telefono_pagador, fecha_operacion, referencia_operacion)
    WHERE metodo = 'pago_movil' AND estado <> 'rechazado';

-- 10. Libro de inventario. Cada INSERT aplica ambos deltas atomicamente.
-- Se inicia cada variante con stock cero; las entradas se registran aqui.
CREATE TABLE movimientos_inventario (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clave_idempotencia uuid NOT NULL UNIQUE,
    variante_id bigint NOT NULL REFERENCES variantes_producto(id) ON DELETE RESTRICT,
    pedido_id uuid,
    tipo varchar(15) NOT NULL
        CHECK (tipo IN ('entrada', 'ajuste', 'reserva', 'liberacion', 'venta', 'devolucion')),
    cambio_fisico integer NOT NULL DEFAULT 0,
    cambio_reservado integer NOT NULL DEFAULT 0,
    motivo text NOT NULL CHECK (btrim(motivo) <> ''),
    administrador_id uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    creado_en timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (pedido_id, variante_id)
        REFERENCES detalle_pedidos(pedido_id, variante_id) ON DELETE RESTRICT,
    CONSTRAINT movimiento_tipo_coherente CHECK (
        (tipo = 'entrada' AND cambio_fisico > 0 AND cambio_reservado = 0)
        OR (tipo = 'ajuste' AND cambio_fisico <> 0 AND cambio_reservado = 0)
        OR (tipo = 'reserva' AND cambio_fisico = 0 AND cambio_reservado > 0)
        OR (tipo = 'liberacion' AND cambio_fisico = 0 AND cambio_reservado < 0)
        OR (tipo = 'venta' AND cambio_fisico < 0 AND cambio_reservado = cambio_fisico)
        OR (tipo = 'devolucion' AND cambio_fisico > 0 AND cambio_reservado = 0)
    ),
    CHECK (tipo NOT IN ('reserva', 'liberacion', 'venta', 'devolucion') OR pedido_id IS NOT NULL),
    CHECK (tipo NOT IN ('entrada', 'ajuste', 'devolucion') OR administrador_id IS NOT NULL)
);
CREATE INDEX movimientos_variante_fecha_idx ON movimientos_inventario (variante_id, creado_en DESC);
CREATE INDEX movimientos_pedido_idx ON movimientos_inventario (pedido_id, variante_id);

-- 11. Se genera automaticamente al crear el pedido o cambiar su estado.
CREATE TABLE historial_pedidos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pedido_id uuid NOT NULL REFERENCES pedidos(id) ON DELETE RESTRICT,
    estado_anterior varchar(25),
    estado_nuevo varchar(25) NOT NULL,
    administrador_id uuid REFERENCES administradores(id) ON DELETE RESTRICT,
    creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX historial_pedidos_pedido_idx ON historial_pedidos (pedido_id, creado_en DESC);

CREATE FUNCTION actualizar_fecha_modificacion() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    NEW.actualizado_en = now();
    RETURN NEW;
END;
$$;
CREATE TRIGGER administradores_fecha BEFORE UPDATE ON administradores
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();
CREATE TRIGGER productos_fecha BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();
CREATE TRIGGER variantes_fecha BEFORE UPDATE ON variantes_producto
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();
CREATE TRIGGER pedidos_fecha BEFORE UPDATE ON pedidos
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();
CREATE TRIGGER pagos_fecha BEFORE UPDATE ON pagos
    FOR EACH ROW EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE FUNCTION impedir_modificacion_historial() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    RAISE EXCEPTION 'La tabla % conserva historial: registra una nueva fila en vez de editar o borrar', TG_TABLE_NAME;
END;
$$;
CREATE TRIGGER tasas_inmutables BEFORE UPDATE OR DELETE ON tasas_cambio
    FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_historial();
CREATE TRIGGER movimientos_inmutables BEFORE UPDATE OR DELETE ON movimientos_inventario
    FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_historial();
CREATE TRIGGER historial_inmutable BEFORE UPDATE OR DELETE ON historial_pedidos
    FOR EACH ROW EXECUTE FUNCTION impedir_modificacion_historial();

CREATE FUNCTION aplicar_movimiento_inventario() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    reservado_pedido bigint;
    vendido_pedido bigint;
    cantidad_pedido integer;
BEGIN
    -- UPDATE bloquea la fila; dos reservas simultaneas no leen un saldo viejo.
    -- Los CHECK de la variante rechazan cantidades negativas o sobre-reserva.
    UPDATE public.variantes_producto
       SET stock_fisico = stock_fisico + NEW.cambio_fisico,
           stock_reservado = stock_reservado + NEW.cambio_reservado
     WHERE id = NEW.variante_id;
    IF NEW.pedido_id IS NOT NULL THEN
        -- No se puede liberar/vender la reserva de OTRO pedido.
        SELECT sum(cambio_reservado),
               -coalesce(sum(cambio_fisico) FILTER (WHERE tipo IN ('venta', 'devolucion')), 0)
          INTO reservado_pedido, vendido_pedido
          FROM public.movimientos_inventario
         WHERE pedido_id = NEW.pedido_id AND variante_id = NEW.variante_id;
        SELECT cantidad INTO cantidad_pedido FROM public.detalle_pedidos
         WHERE pedido_id = NEW.pedido_id AND variante_id = NEW.variante_id;
        IF reservado_pedido < 0 OR vendido_pedido < 0
           OR reservado_pedido + vendido_pedido > cantidad_pedido THEN
            RAISE EXCEPTION 'Reserva, venta o devolucion incompatible con el detalle del pedido'
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER inventario_aplicar AFTER INSERT ON movimientos_inventario
    FOR EACH ROW EXECUTE FUNCTION aplicar_movimiento_inventario();

-- Se comprueba al COMMIT: permite insertar cabecera y lineas en una transaccion.
CREATE FUNCTION validar_subtotal_pedido() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE
    ids uuid[];
    id_pedido uuid;
    subtotal numeric;
    suma_lineas numeric;
BEGIN
    IF TG_TABLE_NAME = 'pedidos' THEN
        ids = ARRAY[NEW.id];
    ELSIF TG_OP = 'INSERT' THEN
        ids = ARRAY[NEW.pedido_id];
    ELSIF TG_OP = 'DELETE' THEN
        ids = ARRAY[OLD.pedido_id];
    ELSE
        ids = ARRAY[OLD.pedido_id, NEW.pedido_id];
    END IF;
    FOR id_pedido IN SELECT DISTINCT unnest(ids) ORDER BY 1 LOOP
        SELECT subtotal_ref_usd INTO subtotal FROM public.pedidos
         WHERE id = id_pedido FOR UPDATE;
        IF FOUND THEN
            SELECT coalesce(sum(total_linea_ref_usd), 0) INTO suma_lineas
              FROM public.detalle_pedidos WHERE pedido_id = id_pedido;
            IF subtotal <> suma_lineas THEN
                RAISE EXCEPTION 'El subtotal del pedido debe coincidir con la suma de sus lineas'
                    USING ERRCODE = '23514';
            END IF;
        END IF;
    END LOOP;
    RETURN NULL;
END;
$$;
CREATE CONSTRAINT TRIGGER pedidos_subtotal AFTER INSERT OR UPDATE ON pedidos
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_subtotal_pedido();
CREATE CONSTRAINT TRIGGER detalle_subtotal AFTER INSERT OR UPDATE OR DELETE ON detalle_pedidos
    DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION validar_subtotal_pedido();

CREATE FUNCTION registrar_estado_pedido() RETURNS trigger
LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.historial_pedidos (pedido_id, estado_nuevo, administrador_id)
        VALUES (NEW.id, NEW.estado, NEW.actualizado_por);
    ELSIF NEW.estado IS DISTINCT FROM OLD.estado THEN
        INSERT INTO public.historial_pedidos (pedido_id, estado_anterior, estado_nuevo, administrador_id)
        VALUES (NEW.id, OLD.estado, NEW.estado, NEW.actualizado_por);
    END IF;
    RETURN NEW;
END;
$$;
CREATE TRIGGER pedidos_historial AFTER INSERT OR UPDATE OF estado ON pedidos
    FOR EACH ROW EXECUTE FUNCTION registrar_estado_pedido();

COMMENT ON COLUMN variantes_producto.precio_ref_usd IS
    'Referencia comercial en USD. Bs = referencia * tasa EUR/VES; no es una conversion USD/VES.';
COMMENT ON COLUMN pedidos.costo_entrega_ref_usd IS
    'NULL significa por confirmar; 0 significa sin costo. Pickup requiere 0.';
COMMENT ON COLUMN pedidos.id IS
    'UUID de referencia del pedido. No sustituye autorizacion para consultar datos personales.';
COMMENT ON COLUMN pagos.comprobante_clave_privada IS
    'Clave de archivo en almacenamiento privado, nunca URL publica del comprobante.';
COMMENT ON TABLE movimientos_inventario IS
    'Insertar movimientos dentro de la transaccion del pedido. No actualizar stock directamente.';

COMMIT;
