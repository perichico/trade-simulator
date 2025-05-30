-- Script de inicialización para la base de datos MySQL en Docker

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS trade_simulator_db;
USE trade_simulator_db;

-- Eliminar tabla dividendos si ya existe para evitar conflictos
DROP TABLE IF EXISTS dividendos;

-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') DEFAULT 'usuario',
    estado ENUM('activo', 'suspendido') DEFAULT 'activo',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla tipo_activo si no existe
CREATE TABLE IF NOT EXISTS tipo_activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla activos si no existe
CREATE TABLE IF NOT EXISTS activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    simbolo VARCHAR(50) NOT NULL UNIQUE,
    tipo_activo_id INT,
    ultimo_precio DECIMAL(15,4) DEFAULT 0,
    porcentaje_dividendo DECIMAL(5,2) DEFAULT 0,
    frecuencia_dividendo ENUM('trimestral', 'semestral', 'anual') NULL,
    ultima_fecha_dividendo DATE NULL,
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_activo_id) REFERENCES tipo_activo(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de portafolio
CREATE TABLE IF NOT EXISTS portafolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL DEFAULT 'Portafolio Principal',
    descripcion TEXT NULL,
    usuario_id INT NOT NULL,
    saldo DECIMAL(15,2) DEFAULT 10000.00,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de portafolio_activo
CREATE TABLE IF NOT EXISTS portafolio_activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    portafolio_id INT NOT NULL,
    activo_id INT NOT NULL,
    cantidad DECIMAL(15,4) NOT NULL DEFAULT 0,
    FOREIGN KEY (portafolio_id) REFERENCES portafolio(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_portafolio_activo (portafolio_id, activo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de transacciones
CREATE TABLE IF NOT EXISTS transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    tipo ENUM('compra', 'venta') NOT NULL,
    cantidad DECIMAL(15,4) NOT NULL,
    precio DECIMAL(15,4) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    orden_id INT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de historial_precios
CREATE TABLE IF NOT EXISTS historial_precios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    precio DECIMAL(15,4) NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE,
    INDEX idx_activo_fecha (activo_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- No incluimos el script de datos principal aquí para evitar conflictos
-- Los scripts se ejecutarán en orden alfabético por Docker

-- Mensaje de confirmación
SELECT 'Base de datos inicializada correctamente' AS mensaje;