-- Migración para agregar campos precio_compra y fecha_compra a portafolio_activo

USE trade_simulator;

-- Verificar si la columna precio_compra ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'portafolio_activo'
    AND column_name = 'precio_compra'
);

-- Agregar columna precio_compra si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE portafolio_activo ADD COLUMN precio_compra DECIMAL(15, 6) DEFAULT 0.00 COMMENT "Precio promedio ponderado de compra"',
    'SELECT "La columna precio_compra ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna fecha_compra ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'portafolio_activo'
    AND column_name = 'fecha_compra'
);

-- Agregar columna fecha_compra si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE portafolio_activo ADD COLUMN fecha_compra DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT "Fecha de la última compra"',
    'SELECT "La columna fecha_compra ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar registros existentes con precio por defecto si es necesario
UPDATE portafolio_activo 
SET precio_compra = 0.00, fecha_compra = CURRENT_TIMESTAMP 
WHERE precio_compra IS NULL OR fecha_compra IS NULL;

SELECT 'Migración completada exitosamente' AS resultado;
