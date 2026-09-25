-- Ejecutar con psql conectado a postgres. No borra bases ni tablas existentes.
\set ON_ERROR_STOP on
SELECT 'CREATE DATABASE blue_fragancias'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'blue_fragancias')
\gexec
\connect blue_fragancias
\ir 001_esquema_inicial.sql
\dt public.*

