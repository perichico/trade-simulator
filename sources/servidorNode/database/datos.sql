-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    estado ENUM('activo', 'suspendido') NOT NULL DEFAULT 'activo',
    fechaRegistro DATETIME DEFAULT CURRENT_TIMESTAMP,
    fechaActualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de tipo_activo
CREATE TABLE tipo_activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

-- Crear tabla de activos
CREATE TABLE activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    simbolo VARCHAR(50) NOT NULL UNIQUE,
    tipo_activo_id INT NOT NULL,
    ultimo_precio DECIMAL(10, 2),
    ultima_actualizacion DATETIME,
    porcentaje_dividendo DECIMAL(5, 2) DEFAULT 0.00,
    frecuencia_dividendo ENUM('trimestral', 'semestral', 'anual') DEFAULT 'anual',
    ultima_fecha_dividendo DATE DEFAULT NULL,
    FOREIGN KEY (tipo_activo_id) REFERENCES tipo_activo(id) ON DELETE CASCADE
);

-- Crear tabla de portafolio
CREATE TABLE portafolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    usuario_id INT NOT NULL,
    saldo DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear tabla de portafolio_activo
CREATE TABLE portafolio_activo (
    portafolio_id INT NOT NULL,
    activo_id INT NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (portafolio_id, activo_id),
    FOREIGN KEY (portafolio_id) REFERENCES portafolio(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Crear tabla de historial_precios (para mantener registro histórico)
CREATE TABLE historial_precios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE,
    INDEX idx_activo_fecha (activo_id, fecha)
);

-- Crear tabla de dividendos
CREATE TABLE dividendos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    fecha DATE NOT NULL,
    monto_por_accion DECIMAL(15, 6) NOT NULL,
    estado VARCHAR(255) DEFAULT 'pendiente',
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Crear tabla de ordenes
CREATE TABLE ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    tipo ENUM('compra', 'venta') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio_limite DECIMAL(10, 2),
    estado ENUM('pendiente', 'ejecutada', 'cancelada') NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    fecha_ejecucion DATETIME,
    precio_ejecutado DECIMAL(10, 2),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Crear tabla de alertas
CREATE TABLE alertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    precio_objetivo DECIMAL(10, 2) NOT NULL,
    cantidad_venta INT,
    condicion ENUM('mayor', 'menor') NOT NULL DEFAULT 'mayor',
    estado ENUM('activa', 'disparada', 'cancelada') NOT NULL DEFAULT 'activa',
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_disparo DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Crear tabla de transacciones
CREATE TABLE transacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    activo_id INT NOT NULL,
    tipo ENUM('compra', 'venta') NOT NULL,
    cantidad DECIMAL(10, 2) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    orden_id INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE,
    FOREIGN KEY (orden_id) REFERENCES ordenes(id) ON DELETE SET NULL
);

-- Insertar tipos de activo
INSERT INTO tipo_activo (nombre) VALUES
('Acciones'),
('ETFs'),
('Bonos'),
('Materias Primas'),
('Criptomonedas'),
('Forex');

-- Insertar activos
INSERT INTO activos (nombre, simbolo, tipo_activo_id, porcentaje_dividendo, frecuencia_dividendo, ultima_fecha_dividendo, ultimo_precio, ultima_actualizacion) VALUES
-- Acciones de empresas populares
('Apple Inc.', 'AAPL', 1, 0.56, 'trimestral', '2023-11-10', 211.26, '2024-05-16 16:00:01'),
('Microsoft Corporation', 'MSFT', 1, 0.88, 'trimestral', '2023-11-15', 454.27, '2024-05-16 16:00:01'),
('Tesla, Inc.', 'TSLA', 1, 0.00, NULL, NULL, 349.98, '2024-05-16 16:00:01'),
('Amazon.com Inc.', 'AMZN', 1, 0.00, NULL, NULL, 205.59, '2024-05-16 16:00:01'),
('Alphabet Inc.', 'GOOGL', 1, 0.00, NULL, NULL, 176.50, '2024-05-16 16:00:01'),
('Meta Platforms Inc.', 'META', 1, 0.00, NULL, NULL, 472.75, '2024-05-16 16:00:01'),
('NVIDIA Corporation', 'NVDA', 1, 0.04, 'trimestral', '2023-12-05', 135.40, '2024-05-16 16:00:01'),
('Netflix Inc.', 'NFLX', 1, 0.00, NULL, NULL, 1191.53, '2024-05-16 16:00:01'),
('Intel Corporation', 'INTC', 1, 1.46, 'trimestral', '2023-11-07', 21.66, '2024-05-16 16:00:01'),
('Advanced Micro Devices Inc.', 'AMD', 1, 0.00, NULL, NULL, 76.06, '2024-05-16 16:00:01'),
('Visa Inc.', 'V', 1, 0.78, 'trimestral', '2023-11-30', 291.91, '2024-05-16 16:00:01'),
('Mastercard Inc.', 'MA', 1, 0.60, 'trimestral', '2023-10-09', 365.12, '2024-05-16 16:00:01'),
('Johnson & Johnson', 'JNJ', 1, 3.00, 'trimestral', '2023-11-21', 151.33, '2024-05-16 16:00:01'),
('Coca-Cola Company', 'KO', 1, 3.20, 'trimestral', '2023-12-15', 72.00, '2024-05-16 16:00:01'),
('PepsiCo Inc.', 'PEP', 1, 2.75, 'trimestral', '2023-12-01', 163.28, '2024-05-16 16:00:01'),
('Berkshire Hathaway Inc.', 'BRK-B', 1, 0.00, NULL, NULL, 273.63, '2024-05-16 16:00:01'),
('ExxonMobil Corporation', 'XOM', 1, 3.85, 'trimestral', '2023-11-13', 108.19, '2024-05-16 16:00:01'),
('Chevron Corporation', 'CVX', 1, 4.10, 'trimestral', '2023-11-17', 142.10, '2024-05-16 16:00:01'),
('Walmart Inc.', 'WMT', 1, 1.40, 'trimestral', '2023-12-06', 98.24, '2024-05-16 16:00:01'),
('McDonalds Corporation', 'MCD', 1, 2.30, 'trimestral', '2023-11-30', 318.61, '2024-05-16 16:00:01'),

-- Índices bursátiles
('S&P 500', '^GSPC', 2, 0.00, NULL, NULL, 5958.37, '2024-05-16 16:00:01'),
('Dow Jones Industrial Average', '^DJI', 2, 0.00, NULL, NULL, 39850.12, '2024-05-16 16:00:01'),
('Nasdaq 100', '^NDX', 2, 0.00, NULL, NULL, 20861.00, '2024-05-16 16:00:01'),
('Russell 2000', '^RUT', 2, 0.00, NULL, NULL, 2372.30, '2024-05-16 16:00:01'),
('DAX', '^GDAXI', 2, 0.00, NULL, NULL, 18768.95, '2024-05-16 16:00:01'),
('IBEX 35', '^IBEX', 2, 0.00, NULL, NULL, 11142.70, '2024-05-16 16:00:01'),
('FTSE 100', '^FTSE', 2, 0.00, NULL, NULL, 8435.28, '2024-05-16 16:00:01'),
('CAC 40', '^FCHI', 2, 0.00, NULL, NULL, 8187.65, '2024-05-16 16:00:01'),
('Nikkei 225', '^N225', 2, 0.00, NULL, NULL, 38920.26, '2024-05-16 16:00:01'),
('Hang Seng', '^HSI', 2, 0.00, NULL, NULL, 19274.08, '2024-05-16 16:00:01'),

-- ETFs
('SPDR S&P 500 ETF', 'SPY', 2, 1.42, 'trimestral', '2023-12-18', 595.82, '2024-05-16 16:00:01'),
('Invesco QQQ Trust', 'QQQ', 2, 0.55, 'trimestral', '2023-12-20', 478.25, '2024-05-16 16:00:01'),
('Vanguard Total Stock Market ETF', 'VTI', 2, 1.38, 'trimestral', '2023-12-22', 262.45, '2024-05-16 16:00:01'),
('iShares MSCI Emerging Markets ETF', 'EEM', 2, 2.10, 'semestral', '2023-12-15', 43.78, '2024-05-16 16:00:01'),
('ARK Innovation ETF', 'ARKK', 2, 0.00, NULL, NULL, 62.33, '2024-05-16 16:00:01'),

-- Criptomonedas
('Bitcoin USD', 'BTC-USD', 5, 0.00, NULL, NULL, 106300.51, '2024-05-16 16:00:01'),
('Ethereum USD', 'ETH-USD', 5, 0.00, NULL, NULL, 2579.24, '2024-05-16 16:00:01'),
('Cardano USD', 'ADA-USD', 5, 0.00, NULL, NULL, 0.7716, '2024-05-16 16:00:01'),
('Solana USD', 'SOL-USD', 5, 0.00, NULL, NULL, 176.26, '2024-05-16 16:00:01'),
('XRP USD', 'XRP-USD', 5, 0.00, NULL, NULL, 2.44, '2024-05-16 16:00:01'),
('Binance Coin USD', 'BNB-USD', 5, 0.00, NULL, NULL, 657.24, '2024-05-16 16:00:01'),
('Dogecoin USD', 'DOGE-USD', 5, 0.00, NULL, NULL, 0.2361, '2024-05-16 16:00:01'),
('Polkadot USD', 'DOT-USD', 5, 0.00, NULL, NULL, 4.88, '2024-05-16 16:00:01'),
('Shiba Inu USD', 'SHIB-USD', 5, 0.00, NULL, NULL, 0.00001522, '2024-05-16 16:00:01'),
('Litecoin USD', 'LTC-USD', 5, 0.00, NULL, NULL, 102.24, '2024-05-16 16:00:01'),

-- Forex
('EUR/USD', 'EURUSD=X', 6, 0.00, NULL, NULL, 1.0865, '2024-05-16 16:00:01'),
('USD/JPY', 'USDJPY=X', 6, 0.00, NULL, NULL, 155.82, '2024-05-16 16:00:01'),
('GBP/USD', 'GBPUSD=X', 6, 0.00, NULL, NULL, 1.2675, '2024-05-16 16:00:01'),
('USD/MXN', 'USDMXN=X', 6, 0.00, NULL, NULL, 16.7850, '2024-05-16 16:00:01'),
('USD/BRL', 'USDBRL=X', 6, 0.00, NULL, NULL, 5.1420, '2024-05-16 16:00:01'),
('USD/CHF', 'USDCHF=X', 6, 0.00, NULL, NULL, 0.9075, '2024-05-16 16:00:01'),
('USD/CAD', 'USDCAD=X', 6, 0.00, NULL, NULL, 1.3645, '2024-05-16 16:00:01'),
('USD/CNY', 'USDCNY=X', 6, 0.00, NULL, NULL, 7.2275, '2024-05-16 16:00:01'),

-- Materias Primas
('Oro', 'GC=F', 4, 0.00, NULL, NULL, 2385.20, '2024-05-16 16:00:01'),
('Plata', 'SI=F', 4, 0.00, NULL, NULL, 30.25, '2024-05-16 16:00:01'),
('Cobre', 'HG=F', 4, 0.00, NULL, NULL, 4.85, '2024-05-16 16:00:01'),
('Petróleo WTI', 'CL=F', 4, 0.00, NULL, NULL, 78.65, '2024-05-16 16:00:01'),
('Petróleo Brent', 'BZ=F', 4, 0.00, NULL, NULL, 82.85, '2024-05-16 16:00:01'),
('Gas Natural', 'NG=F', 4, 0.00, NULL, NULL, 2.32, '2024-05-16 16:00:01'),
('Maíz', 'ZC=F', 4, 0.00, NULL, NULL, 452.75, '2024-05-16 16:00:01'),
('Trigo', 'ZW=F', 4, 0.00, NULL, NULL, 625.50, '2024-05-16 16:00:01'),
('Soja', 'ZS=F', 4, 0.00, NULL, NULL, 1185.25, '2024-05-16 16:00:01'),

-- Bonos
('Bono del Tesoro EE.UU. 10 años', '^TNX', 3, 4.25, 'semestral', '2023-11-15', 4.38, '2024-05-16 16:00:01'),
('Bono del Tesoro EE.UU. 30 años', '^TYX', 3, 4.50, 'semestral', '2023-11-15', 4.52, '2024-05-16 16:00:01'),
('Bono del Tesoro EE.UU. 5 años', '^FVX', 3, 4.10, 'semestral', '2023-11-15', 4.25, '2024-05-16 16:00:01'),
('Bono alemán 10 años', '^DE10Y', 3, 2.75, 'anual', '2023-10-15', 2.45, '2024-05-16 16:00:01'),
('Bono japonés 10 años', '^JP10Y', 3, 0.85, 'semestral', '2023-09-20', 0.95, '2024-05-16 16:00:01');


-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, email, contrasena, rol, estado, fechaRegistro) VALUES
('Juan Pérez', 'juan.perez@email.com', 'hash_contraseña_segura', 'usuario', 'activo', '2024-01-15 10:30:00'),
('María García', 'maria.garcia@email.com', 'hash_contraseña_segura', 'usuario', 'activo', '2024-02-20 14:15:00'),
('test', 'test@test.com', '$2b$10$bJ8KDFyIx8q99WrwBW23Zexwf0mc.BvF8VEYLGDY1pLpPXjb.yULO', 'usuario', 'activo', '2024-03-10 09:45:00'),
('admin', 'admin@admin.com', '$2b$10$Y2iHdCdAsRNc/bYVnsll..geCglB1AR9Tz8oEbjZWnjzdbJnu84oK', 'admin', 'activo', '2024-01-01 08:00:00');

-- Insertar portafolios de prueba
INSERT INTO portafolio (nombre, usuario_id) VALUES
('Portafolio Principal', 1),
('Inversiones Largo Plazo', 1),
('Trading Activo', 2);

-- Insertar posiciones en portafolios
INSERT INTO portafolio_activo (portafolio_id, activo_id, cantidad) VALUES
(1, 1, 10.00),  -- 10 acciones de Apple en Portafolio Principal
(1, 2, 5.00),   -- 5 acciones de Microsoft en Portafolio Principal
(2, 6, 20.00),  -- 20 unidades de SPY en Inversiones Largo Plazo
(3, 9, 0.5);    -- 0.5 BTC en Trading Activo

-- Insertar portafolio para el usuario test (ID 3)
INSERT INTO portafolio (nombre, usuario_id, saldo) VALUES
('Mi Portafolio', 3, 10000.00);

-- Insertar posiciones para el usuario test
INSERT INTO portafolio_activo (portafolio_id, activo_id, cantidad) VALUES
(4, 1, 15.00),   -- 15 acciones de Apple
(4, 2, 8.00),    -- 8 acciones de Microsoft
(4, 7, 5.00),    -- 5 acciones de NVIDIA
(4, 11, 10.00),  -- 10 acciones de Visa
(4, 31, 5.00);   -- 5 unidades de SPY ETF

-- Insertar dividendos de ejemplo para los activos del usuario test (ID 3)
INSERT INTO dividendos (activo_id, fecha, monto_por_accion, estado) VALUES
-- Dividendos históricos pagados de Apple (activo_id 1)
(1, '2023-02-16', 0.230000, 'pagado'),  -- Dividendo histórico pagado de Apple
(1, '2023-05-18', 0.230000, 'pagado'),  -- Dividendo histórico pagado de Apple
(1, '2023-08-17', 0.240000, 'pagado'),  -- Dividendo histórico pagado de Apple
(1, '2023-11-16', 0.240000, 'pagado'),  -- Dividendo histórico pagado de Apple
(1, '2024-02-15', 0.240000, 'pendiente'),  -- Dividendo trimestral de Apple
(1, '2024-05-15', 0.240000, 'pendiente'),  -- Próximo dividendo trimestral de Apple
(1, '2024-08-15', 0.250000, 'pendiente'),  -- Dividendo trimestral futuro con ligero aumento

-- Dividendos históricos pagados de Microsoft (activo_id 2)
(2, '2023-03-09', 0.650000, 'pagado'),  -- Dividendo histórico pagado de Microsoft
(2, '2023-06-08', 0.650000, 'pagado'),  -- Dividendo histórico pagado de Microsoft
(2, '2023-09-14', 0.680000, 'pagado'),  -- Dividendo histórico pagado de Microsoft
(2, '2023-12-14', 0.680000, 'pagado'),  -- Dividendo histórico pagado de Microsoft
(2, '2024-03-10', 0.680000, 'pendiente'),  -- Dividendo trimestral de Microsoft
(2, '2024-06-10', 0.680000, 'pendiente'),  -- Próximo dividendo trimestral de Microsoft

-- Dividendos históricos pagados de NVIDIA (activo_id 7)
(7, '2023-03-22', 0.040000, 'pagado'),  -- Dividendo histórico pagado de NVIDIA
(7, '2023-06-21', 0.040000, 'pagado'),  -- Dividendo histórico pagado de NVIDIA
(7, '2023-09-20', 0.040000, 'pagado'),  -- Dividendo histórico pagado de NVIDIA
(7, '2023-12-20', 0.040000, 'pagado'),  -- Dividendo histórico pagado de NVIDIA
(7, '2024-03-25', 0.040000, 'pendiente'),  -- Dividendo trimestral de NVIDIA
(7, '2024-06-25', 0.040000, 'pendiente'),  -- Próximo dividendo trimestral de NVIDIA

-- Dividendos históricos pagados de Visa (activo_id 11)
(11, '2023-03-03', 0.450000, 'pagado'), -- Dividendo histórico pagado de Visa
(11, '2023-06-02', 0.450000, 'pagado'), -- Dividendo histórico pagado de Visa
(11, '2023-09-01', 0.480000, 'pagado'), -- Dividendo histórico pagado de Visa
(11, '2023-12-01', 0.520000, 'pagado'), -- Dividendo histórico pagado de Visa
(11, '2024-03-01', 0.520000, 'pendiente'), -- Dividendo trimestral de Visa
(11, '2024-06-01', 0.520000, 'pendiente'), -- Próximo dividendo trimestral de Visa

-- Dividendos históricos pagados de SPY ETF (activo_id 31)
(31, '2023-03-17', 1.470000, 'pagado'), -- Dividendo histórico pagado de SPY ETF
(31, '2023-06-16', 1.480000, 'pagado'), -- Dividendo histórico pagado de SPY ETF
(31, '2023-09-15', 1.510000, 'pagado'), -- Dividendo histórico pagado de SPY ETF
(31, '2023-12-15', 1.550000, 'pagado'), -- Dividendo histórico pagado de SPY ETF
(31, '2024-03-20', 1.570000, 'pendiente'), -- Dividendo trimestral de SPY ETF
(31, '2024-06-20', 1.600000, 'pendiente')  -- Próximo dividendo trimestral de SPY ETF con ligero aumento

-- Drop all tables in the correct order (due to foreign key constraints)
-- DROP TABLE IF EXISTS transacciones;
-- DROP TABLE IF EXISTS alertas;
-- DROP TABLE IF EXISTS ordenes;
-- DROP TABLE IF EXISTS dividendos;
-- DROP TABLE IF EXISTS historial_precios;
-- DROP TABLE IF EXISTS portafolio_activo;
-- DROP TABLE IF EXISTS portafolio;
-- DROP TABLE IF EXISTS activos;
-- DROP TABLE IF EXISTS tipo_activo;
-- DROP TABLE IF EXISTS usuarios;

--DELETE FROM historial_precios;