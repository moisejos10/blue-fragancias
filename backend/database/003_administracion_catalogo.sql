-- BF-014/015. Aplicar una vez como administrador en blue_fragancias.
-- Conserva tablas y datos existentes. No crea cuentas ni productos de ejemplo.
\set ON_ERROR_STOP on
BEGIN;
SET LOCAL search_path = pg_catalog, public;

DO $$ BEGIN
  IF current_database() <> 'blue_fragancias' THEN
    RAISE EXCEPTION 'Conectate a blue_fragancias antes de aplicar 003';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'blue_fragancias_app') THEN
    RAISE EXCEPTION 'Primero debe estar aplicada la migracion 002';
  END IF;
END $$;

CREATE TABLE public.sesiones_admin (
  token_hash text PRIMARY KEY CHECK (token_hash ~ '^[a-f0-9]{64}$'),
  administrador_id uuid NOT NULL REFERENCES public.administradores(id) ON DELETE CASCADE,
  csrf_token text NOT NULL CHECK (csrf_token ~ '^[a-f0-9]{64}$'),
  vence_en timestamptz NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sesiones_admin_vencimiento_idx ON public.sesiones_admin(vence_en);

CREATE TABLE public.configuracion_tienda (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  logo_clave text,
  actualizado_en timestamptz NOT NULL DEFAULT now()
);
INSERT INTO public.configuracion_tienda(id) VALUES (true);

GRANT SELECT (id, nombre, email, hash_password, activo) ON public.administradores TO blue_fragancias_app;
GRANT SELECT, INSERT, DELETE ON public.sesiones_admin TO blue_fragancias_app;
GRANT SELECT ON public.configuracion_tienda TO blue_fragancias_app;
GRANT UPDATE (logo_clave, actualizado_en) ON public.configuracion_tienda TO blue_fragancias_app;
GRANT INSERT (nombre) ON public.marcas TO blue_fragancias_app;
GRANT INSERT (marca_id, nombre, slug, descripcion, genero, familia_olfativa, activo),
  UPDATE (marca_id, nombre, slug, descripcion, genero, familia_olfativa, activo)
  ON public.productos TO blue_fragancias_app;
GRANT INSERT (producto_id, sku, presentacion, tipo_presentacion, concentracion, volumen_ml, precio_ref_usd, activo),
  UPDATE (sku, presentacion, tipo_presentacion, concentracion, volumen_ml, precio_ref_usd, activo)
  ON public.variantes_producto TO blue_fragancias_app;
GRANT INSERT (producto_id, clave_archivo, texto_alternativo, orden),
  UPDATE (clave_archivo, texto_alternativo, orden), DELETE
  ON public.imagenes_producto TO blue_fragancias_app;
GRANT USAGE ON SEQUENCE public.marcas_id_seq, public.productos_id_seq,
  public.variantes_producto_id_seq, public.imagenes_producto_id_seq TO blue_fragancias_app;

-- Inicializacion exclusivamente desde un comando local, sin registro HTTP publico.
CREATE FUNCTION public.crear_primer_administrador(p_nombre text, p_email text, p_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE nuevo_id uuid;
BEGIN
  PERFORM pg_advisory_xact_lock(73001);
  IF EXISTS (SELECT 1 FROM public.administradores) THEN
    RAISE EXCEPTION 'Ya existe un administrador' USING ERRCODE = '23505';
  END IF;
  IF length(p_nombre) NOT BETWEEN 1 AND 120 OR length(p_email) > 254
    OR p_hash NOT LIKE '$argon2id$%' THEN
    RAISE EXCEPTION 'Datos de administrador invalidos' USING ERRCODE = '23514';
  END IF;
  INSERT INTO public.administradores(nombre, email, hash_password)
    VALUES (btrim(p_nombre), lower(btrim(p_email)), p_hash) RETURNING id INTO nuevo_id;
  REVOKE EXECUTE ON FUNCTION public.crear_primer_administrador(text,text,text) FROM blue_fragancias_app;
  RETURN nuevo_id;
END $$;
REVOKE ALL ON FUNCTION public.crear_primer_administrador(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crear_primer_administrador(text,text,text) TO blue_fragancias_app;

-- El rol tecnico solo modifica saldos a traves del trigger de movimientos.
CREATE ROLE blue_fragancias_inventario NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT USAGE ON SCHEMA public TO blue_fragancias_inventario;
GRANT SELECT (id, activo) ON public.administradores TO blue_fragancias_inventario;
GRANT SELECT ON public.variantes_producto, public.movimientos_inventario TO blue_fragancias_inventario;
GRANT UPDATE (stock_fisico, stock_reservado) ON public.variantes_producto TO blue_fragancias_inventario;
GRANT INSERT (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id)
  ON public.movimientos_inventario TO blue_fragancias_inventario;
GRANT USAGE ON SEQUENCE public.movimientos_inventario_id_seq TO blue_fragancias_inventario;

CREATE FUNCTION public.registrar_entrada_catalogo(
  p_variante bigint, p_cantidad integer, p_motivo text, p_admin uuid, p_clave uuid
) RETURNS bigint LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE movimiento public.movimientos_inventario%ROWTYPE; nuevo_id bigint;
BEGIN
  IF p_variante IS NULL OR p_cantidad IS NULL OR p_cantidad NOT BETWEEN 1 AND 100000
    OR p_motivo IS NULL OR length(btrim(p_motivo)) NOT BETWEEN 1 AND 500
    OR p_clave IS NULL THEN
    RAISE EXCEPTION 'Entrada invalida' USING ERRCODE = '23514';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.administradores WHERE id = p_admin AND activo) THEN
    RAISE EXCEPTION 'Administrador no activo' USING ERRCODE = '42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_clave::text, 0));
  SELECT * INTO movimiento FROM public.movimientos_inventario WHERE clave_idempotencia = p_clave;
  IF FOUND THEN
    IF movimiento.variante_id <> p_variante OR movimiento.cambio_fisico <> p_cantidad
      OR movimiento.tipo <> 'entrada' OR movimiento.administrador_id IS DISTINCT FROM p_admin
      OR movimiento.motivo <> btrim(p_motivo) THEN
      RAISE EXCEPTION 'Clave reutilizada con otros datos' USING ERRCODE = '23505';
    END IF;
    RETURN movimiento.id;
  END IF;
  INSERT INTO public.movimientos_inventario
    (clave_idempotencia, variante_id, tipo, cambio_fisico, motivo, administrador_id)
    VALUES (p_clave, p_variante, 'entrada', p_cantidad, btrim(p_motivo), p_admin)
    RETURNING id INTO nuevo_id;
  RETURN nuevo_id;
END $$;
ALTER FUNCTION public.registrar_entrada_catalogo(bigint,integer,text,uuid,uuid) OWNER TO blue_fragancias_inventario;
REVOKE ALL ON FUNCTION public.registrar_entrada_catalogo(bigint,integer,text,uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.registrar_entrada_catalogo(bigint,integer,text,uuid,uuid) TO blue_fragancias_app;

COMMIT;
\echo Administracion preparada. Crear la cuenta inicial con npm run admin:crear desde backend.
