-- Migración para añadir campos de dividendos a la tabla activos

-- Verificar si la columna porcentaje_dividendo ya existe
SET @existeColumna = 0;
SELECT COUNT(*) INTO @existeColumna FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activos' AND COLUMN_NAME = 'porcentaje_dividendo';

-- Añadir columna porcentaje_dividendo si no existe
SET @sql = IF(@existeColumna = 0, 
    'ALTER TABLE activos ADD COLUMN porcentaje_dividendo DECIMAL(5, 2) DEFAULT 0.00 COMMENT "Porcentaje de dividendo que paga el activo"', 
    'SELECT "La columna porcentaje_dividendo ya existe" AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna frecuencia_dividendo ya existe
SET @existeColumna = 0;
SELECT COUNT(*) INTO @existeColumna FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activos' AND COLUMN_NAME = 'frecuencia_dividendo';

-- Añadir columna frecuencia_dividendo si no existe
SET @sql = IF(@existeColumna = 0, 
    'ALTER TABLE activos ADD COLUMN frecuencia_dividendo ENUM("mensual", "trimestral", "semestral", "anual") COMMENT "Frecuencia con la que se pagan los dividendos"', 
    'SELECT "La columna frecuencia_dividendo ya existe" AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna ultima_fecha_dividendo ya existe
SET @existeColumna = 0;
SELECT COUNT(*) INTO @existeColumna FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'activos' AND COLUMN_NAME = 'ultima_fecha_dividendo';

-- Añadir columna ultima_fecha_dividendo si no existe
SET @sql = IF(@existeColumna = 0, 
    'ALTER TABLE activos ADD COLUMN ultima_fecha_dividendo DATETIME COMMENT "Última fecha en que se pagó un dividendo"', 
    'SELECT "La columna ultima_fecha_dividendo ya existe" AS mensaje');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar algunos activos con valores de ejemplo para dividendos
UPDATE activos SET 
    porcentaje_dividendo = 1.50, 
    frecuencia_dividendo = 'trimestral' 
WHERE tipo_activo_id = 1 LIMIT 5;

UPDATE activos SET 
    porcentaje_dividendo = 2.25, 
    frecuencia_dividendo = 'semestral' 
WHERE tipo_activo_id = 2 LIMIT 3;

UPDATE activos SET 
    porcentaje_dividendo = 3.00, 
    frecuencia_dividendo = 'anual' 
WHERE tipo_activo_id = 3 LIMIT 2;