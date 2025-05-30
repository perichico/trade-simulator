-- Migración para añadir columnas de timestamp a la tabla usuarios

USE trade_simulator;

-- Verificar si la columna fechaRegistro ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'usuarios'
    AND column_name = 'fechaRegistro'
);

-- Añadir la columna fechaRegistro solo si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP',
    'SELECT "La columna fechaRegistro ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificar si la columna fechaActualizacion ya existe
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'usuarios'
    AND column_name = 'fechaActualizacion'
);

-- Añadir la columna fechaActualizacion solo si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'SELECT "La columna fechaActualizacion ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar usuarios existentes que no tengan fechas
UPDATE usuarios 
SET fechaRegistro = CURRENT_TIMESTAMP 
WHERE fechaRegistro IS NULL;

UPDATE usuarios 
SET fechaActualizacion = CURRENT_TIMESTAMP 
WHERE fechaActualizacion IS NULL;

SELECT 'Migración de timestamps completada' AS resultado;
