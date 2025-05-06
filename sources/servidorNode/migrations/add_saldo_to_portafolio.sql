-- Migración para añadir la columna 'saldo' a la tabla 'portafolio'
ALTER TABLE portafolio ADD COLUMN saldo DECIMAL(10, 2) NOT NULL DEFAULT 10000.00;