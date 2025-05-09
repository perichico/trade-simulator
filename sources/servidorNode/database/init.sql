-- Script de inicialización para la base de datos MySQL en Docker

-- Usar la base de datos
USE Bolsa;

-- Incluir el script de datos principal
SOURCE /docker-entrypoint-initdb.d/datos.sql;

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente' AS mensaje;