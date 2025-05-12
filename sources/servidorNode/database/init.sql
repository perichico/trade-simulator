-- Script de inicialización para la base de datos MySQL en Docker

-- Usar la base de datos
USE Bolsa;

-- Eliminar tabla dividendo si ya existe para evitar conflictos
DROP TABLE IF EXISTS dividendo;

-- Crear tabla tipo_activo si no existe
CREATE TABLE IF NOT EXISTS tipo_activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla activo si no existe
CREATE TABLE IF NOT EXISTS activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    simbolo VARCHAR(20) NOT NULL UNIQUE,
    tipo_activo_id INT NOT NULL,
    ultimo_precio DECIMAL(15,6) DEFAULT 0,
    ultima_actualizacion TIMESTAMP NULL,
    porcentaje_dividendo DECIMAL(5,2) DEFAULT 0.00,
    frecuencia_dividendo ENUM('trimestral', 'semestral', 'anual') DEFAULT 'anual',
    ultima_fecha_dividendo DATE DEFAULT NULL,
    INDEX idx_activo_tipo (tipo_activo_id),
    INDEX idx_activo_simbolo (simbolo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla dividendo sin clave foránea
CREATE TABLE IF NOT EXISTS dividendo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    fecha DATE NOT NULL,
    monto_por_accion DECIMAL(15,6) NOT NULL,
    estado ENUM('pendiente', 'pagado', 'cancelado') DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dividendo_activo (activo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Incluir el script de datos principal
SOURCE /docker-entrypoint-initdb.d/datos.sql;

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente' AS mensaje;