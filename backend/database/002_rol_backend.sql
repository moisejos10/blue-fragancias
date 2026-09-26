-- BF-010: ejecutar una vez, como administrador, en blue_fragancias.
-- No modifica la migracion 001 ni los datos de la tienda.
-- La contrasena se asigna aparte con \password en SQL Shell (psql).
\set ON_ERROR_STOP on
BEGIN;

DO $$
BEGIN
    IF current_database() <> 'blue_fragancias' THEN
        RAISE EXCEPTION 'Conectate a blue_fragancias antes de crear el usuario del backend';
    END IF;
    IF to_regclass('public.productos') IS NULL
       OR to_regclass('public.marcas') IS NULL
       OR to_regclass('public.variantes_producto') IS NULL
       OR to_regclass('public.imagenes_producto') IS NULL THEN
        RAISE EXCEPTION 'Falta el esquema inicial; no se crearon permisos';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'blue_fragancias_app') THEN
        RAISE EXCEPTION 'blue_fragancias_app ya existe. Revisa sus permisos; no se cambiara su contrasena ni se reutilizara automaticamente';
    END IF;
END;
$$;

CREATE ROLE blue_fragancias_app LOGIN
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS
    CONNECTION LIMIT 10;
COMMENT ON ROLE blue_fragancias_app IS
    'Blue Fragancias BF-010: lectura de catalogo; permisos futuros mediante nuevas migraciones';

GRANT CONNECT ON DATABASE blue_fragancias TO blue_fragancias_app;
GRANT USAGE ON SCHEMA public TO blue_fragancias_app;
GRANT SELECT ON public.marcas, public.productos,
    public.variantes_producto, public.imagenes_producto TO blue_fragancias_app;
ALTER ROLE blue_fragancias_app IN DATABASE blue_fragancias
    SET search_path = pg_catalog, public;

-- PUBLIC tambien concede permisos: una concesion inesperada debe revisarse.
-- No cambiar permisos de otros usuarios silenciosamente para corregirla.
DO $$
DECLARE
    tabla record;
BEGIN
    IF has_database_privilege('blue_fragancias_app', current_database(), 'CREATE')
       OR has_schema_privilege('blue_fragancias_app', 'public', 'CREATE') THEN
        RAISE EXCEPTION 'Hay permisos heredados de creacion; revisa PUBLIC antes de continuar';
    END IF;

    FOR tabla IN
        SELECT c.oid, c.relname FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
    LOOP
        IF has_table_privilege('blue_fragancias_app', tabla.oid,
                              'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
           OR has_any_column_privilege('blue_fragancias_app', tabla.oid,
                                       'INSERT,UPDATE,REFERENCES') THEN
            RAISE EXCEPTION 'Permiso de escritura inesperado en %; se revierte la creacion del rol', tabla.relname;
        END IF;
        IF tabla.relname NOT IN ('marcas', 'productos', 'variantes_producto', 'imagenes_producto')
           AND (has_table_privilege('blue_fragancias_app', tabla.oid, 'SELECT')
                OR has_any_column_privilege('blue_fragancias_app', tabla.oid, 'SELECT')) THEN
            RAISE EXCEPTION 'Lectura privada heredada en %; se revierte la creacion del rol', tabla.relname;
        END IF;
    END LOOP;

    IF EXISTS (
        SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.prosecdef
          AND has_function_privilege('blue_fragancias_app', p.oid, 'EXECUTE')
    ) THEN
        RAISE EXCEPTION 'Hay funciones con privilegios de propietario accesibles; revisarlas antes de continuar';
    END IF;
END;
$$;

COMMIT;
\echo Rol creado con lectura del catalogo. El siguiente paso es asignar su contrasena desde SQL Shell.
