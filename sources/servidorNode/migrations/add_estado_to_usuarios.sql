-- Migración para añadir el campo 'estado' a la tabla usuarios

-- Verificar si la columna ya existe antes de añadirla
SET @column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns 
    WHERE table_schema = DATABASE()
    AND table_name = 'usuarios'
    AND column_name = 'estado'
);

-- Añadir la columna solo si no existe
SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE usuarios ADD COLUMN estado ENUM(''activo'', ''suspendido'') NOT NULL DEFAULT ''activo''',
    'SELECT "La columna estado ya existe" AS mensaje'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar usuarios existentes que no tengan estado definido
UPDATE usuarios SET estado = 'activo' WHERE estado IS NULL;
