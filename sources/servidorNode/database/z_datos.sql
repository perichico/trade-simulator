-- Script para insertar datos iniciales en la base de datos
-- Este archivo solo contiene inserciones de datos, no definiciones de tablas

USE Bolsa;

-- Insertar tipos de activos
INSERT INTO tipo_activo (nombre, descripcion) VALUES
('Acción', 'Títulos que representan parte de la propiedad de una empresa'),
('ETF', 'Fondos cotizados que siguen índices, sectores o materias primas'),
('Bono', 'Instrumentos de deuda emitidos por gobiernos o empresas'),
('Criptomoneda', 'Activos digitales basados en tecnología blockchain');

-- Insertar activos
INSERT INTO activos (nombre, simbolo, tipo_activo_id, ultimo_precio, ultima_actualizacion) VALUES
('Apple Inc.', 'AAPL', 1, 150.25, NOW()),
('Microsoft Corporation', 'MSFT', 1, 245.75, NOW()),
('Amazon.com Inc.', 'AMZN', 1, 3200.50, NOW()),
('Tesla Inc.', 'TSLA', 1, 650.75, NOW()),
('SPDR S&P 500 ETF', 'SPY', 2, 420.15, NOW()),
('Invesco QQQ Trust', 'QQQ', 2, 350.20, NOW()),
('Bono del Tesoro EE.UU. 10 años', 'US10Y', 3, 98.75, NOW()),
('Bitcoin', 'BTC', 4, 45000.00, NOW()),
('Ethereum', 'ETH', 4, 3000.00, NOW());

-- Insertar usuarios de ejemplo
INSERT INTO usuarios (nombre, email, balance, contrasena) VALUES
('Juan Pérez', 'juan@ejemplo.com', 10000.00, '$2b$10$X7VQHGlX8hLXZFZkJ4XYZ.8j4rZ9VZQHGlX8hLXZFZkJ4XYZ.'),
('María García', 'maria@ejemplo.com', 15000.00, '$2b$10$X7VQHGlX8hLXZFZkJ4XYZ.8j4rZ9VZQHGlX8hLXZFZkJ4XYZ.'),
('Carlos Rodríguez', 'carlos@ejemplo.com', 20000.00, '$2b$10$X7VQHGlX8hLXZFZkJ4XYZ.8j4rZ9VZQHGlX8hLXZFZkJ4XYZ.');

-- Insertar portafolios
INSERT INTO portafolio (nombre, usuario_id, saldo) VALUES
('Portafolio Principal', 1, 5000.00),
('Inversiones a Largo Plazo', 2, 10000.00),
('Trading Activo', 3, 15000.00);

-- Insertar activos en portafolios
INSERT INTO portafolio_activo (portafolio_id, activo_id, cantidad) VALUES
(1, 1, 10.00),  -- Juan tiene 10 acciones de Apple
(1, 3, 2.00),   -- Juan tiene 2 acciones de Amazon
(2, 2, 15.00),  -- María tiene 15 acciones de Microsoft
(2, 5, 20.00),  -- María tiene 20 unidades de SPY ETF
(3, 8, 0.5),    -- Carlos tiene 0.5 Bitcoin
(3, 9, 2.00);   -- Carlos tiene 2 Ethereum

-- Insertar historial de precios
INSERT INTO historial_precios (activo_id, precio, fecha) VALUES
(1, 145.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 148.50, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 150.25, DATE_SUB(NOW(), INTERVAL 5 DAY)),
(2, 240.00, DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 242.50, DATE_SUB(NOW(), INTERVAL 6 DAY)),
(2, 245.75, DATE_SUB(NOW(), INTERVAL 5 DAY));

-- Insertar dividendos
INSERT INTO dividendos (activo_id, fecha, monto_por_accion, estado) VALUES
(1, DATE_ADD(NOW(), INTERVAL 30 DAY), 0.82, 'pendiente'),
(2, DATE_ADD(NOW(), INTERVAL 45 DAY), 0.56, 'pendiente');

-- Mensaje de confirmación
SELECT 'Datos iniciales cargados correctamente' AS mensaje;