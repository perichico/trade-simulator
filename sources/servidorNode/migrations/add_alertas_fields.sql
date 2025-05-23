-- Migration to add missing fields to alertas table
-- Run this script to update the existing alertas table

USE trade_simulator;

-- Add missing columns if they don't exist
ALTER TABLE alertas 
ADD COLUMN IF NOT EXISTS cantidad_venta INT,
ADD COLUMN IF NOT EXISTS activa BOOLEAN NOT NULL DEFAULT TRUE;

-- Update existing records to have default values
UPDATE alertas SET activa = TRUE WHERE activa IS NULL;
UPDATE alertas SET condicion = 'mayor' WHERE condicion IS NULL;
UPDATE alertas SET estado = 'activa' WHERE estado IS NULL;

-- Modify existing columns to add default values
ALTER TABLE alertas 
MODIFY COLUMN condicion ENUM('mayor', 'menor') NOT NULL DEFAULT 'mayor',
MODIFY COLUMN estado ENUM('activa', 'disparada', 'cancelada') NOT NULL DEFAULT 'activa',
MODIFY COLUMN fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

SELECT 'Migration completed successfully' as status;