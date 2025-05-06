-- Añadir columna saldo a la tabla portafolio
ALTER TABLE portafolio ADD COLUMN saldo DECIMAL(10, 2) NOT NULL DEFAULT 10000.00;

-- Actualizar el saldo de cada portafolio con el balance del usuario correspondiente
UPDATE portafolio p
SET saldo = (SELECT balance FROM usuarios u WHERE u.id = p.usuario_id);

-- Eliminar la columna balance de la tabla usuarios
-- Nota: Ejecutar este comando solo después de verificar que la migración de saldos se ha completado correctamente
-- ALTER TABLE usuarios DROP COLUMN balance;