-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL
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
    monto DECIMAL(10, 2) NOT NULL,
    fecha_pago DATETIME NOT NULL,
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
    condicion ENUM('mayor', 'menor') NOT NULL,
    estado ENUM('activa', 'disparada', 'cancelada') NOT NULL,
    fecha_creacion DATETIME NOT NULL,
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
INSERT INTO activos (nombre, simbolo, tipo_activo_id, porcentaje_dividendo, frecuencia_dividendo, ultima_fecha_dividendo) VALUES
-- Acciones de empresas populares
('Apple Inc.', 'AAPL', 1, 0.56, 'trimestral', '2023-11-10'),
('Microsoft Corporation', 'MSFT', 1, 0.88, 'trimestral', '2023-11-15'),
('Tesla, Inc.', 'TSLA', 1, 0.00, NULL, NULL),
('Amazon.com Inc.', 'AMZN', 1, 0.00, NULL, NULL),
('Alphabet Inc.', 'GOOGL', 1, 0.00, NULL, NULL),
('Meta Platforms Inc.', 'META', 1, 0.00, NULL, NULL),
('NVIDIA Corporation', 'NVDA', 1, 0.04, 'trimestral', '2023-12-05'),
('Netflix Inc.', 'NFLX', 1, 0.00, NULL, NULL),
('Intel Corporation', 'INTC', 1, 1.46, 'trimestral', '2023-11-07'),
('Advanced Micro Devices Inc.', 'AMD', 1, 0.00, NULL, NULL),
('Visa Inc.', 'V', 1, 0.78, 'trimestral', '2023-11-30'),
('Mastercard Inc.', 'MA', 1, 0.60, 'trimestral', '2023-10-09'),
('Johnson & Johnson', 'JNJ', 1, 3.00, 'trimestral', '2023-11-21'),
('Coca-Cola Company', 'KO', 1, 3.20, 'trimestral', '2023-12-15'),
('PepsiCo Inc.', 'PEP', 1, 2.75, 'trimestral', '2023-12-01'),
('Berkshire Hathaway Inc.', 'BRK-B', 1, 0.00, NULL, NULL),
('ExxonMobil Corporation', 'XOM', 1, 3.85, 'trimestral', '2023-11-13'),
('Chevron Corporation', 'CVX', 1, 4.10, 'trimestral', '2023-11-17'),
('Walmart Inc.', 'WMT', 1, 1.40, 'trimestral', '2023-12-06'),
('McDonalds Corporation', 'MCD', 1, 2.30, 'trimestral', '2023-11-30'),

-- Índices bursátiles
('S&P 500', '^GSPC', 2, 0.00, NULL, NULL),
('Dow Jones Industrial Average', '^DJI', 2, 0.00, NULL, NULL),
('Nasdaq 100', '^NDX', 2, 0.00, NULL, NULL),
('Russell 2000', '^RUT', 2, 0.00, NULL, NULL),
('DAX', '^GDAXI', 2, 0.00, NULL, NULL),
('IBEX 35', '^IBEX', 2, 0.00, NULL, NULL),
('FTSE 100', '^FTSE', 2, 0.00, NULL, NULL),
('CAC 40', '^FCHI', 2, 0.00, NULL, NULL),
('Nikkei 225', '^N225', 2, 0.00, NULL, NULL),
('Hang Seng', '^HSI', 2, 0.00, NULL, NULL),

-- ETFs
('SPDR S&P 500 ETF', 'SPY', 2, 1.42, 'trimestral', '2023-12-18'),
('Invesco QQQ Trust', 'QQQ', 2, 0.55, 'trimestral', '2023-12-20'),
('Vanguard Total Stock Market ETF', 'VTI', 2, 1.38, 'trimestral', '2023-12-22'),
('iShares MSCI Emerging Markets ETF', 'EEM', 2, 2.10, 'semestral', '2023-12-15'),
('ARK Innovation ETF', 'ARKK', 2, 0.00, NULL, NULL),

-- Criptomonedas
('Bitcoin USD', 'BTC-USD', 5, 0.00, NULL, NULL),
('Ethereum USD', 'ETH-USD', 5, 0.00, NULL, NULL),
('Cardano USD', 'ADA-USD', 5, 0.00, NULL, NULL),
('Solana USD', 'SOL-USD', 5, 0.00, NULL, NULL),
('XRP USD', 'XRP-USD', 5, 0.00, NULL, NULL),
('Binance Coin USD', 'BNB-USD', 5, 0.00, NULL, NULL),
('Dogecoin USD', 'DOGE-USD', 5, 0.00, NULL, NULL),
('Polkadot USD', 'DOT-USD', 5, 0.00, NULL, NULL),
('Shiba Inu USD', 'SHIB-USD', 5, 0.00, NULL, NULL),
('Litecoin USD', 'LTC-USD', 5, 0.00, NULL, NULL),

-- Forex
('EUR/USD', 'EURUSD=X', 6, 0.00, NULL, NULL),
('USD/JPY', 'USDJPY=X', 6, 0.00, NULL, NULL),
('GBP/USD', 'GBPUSD=X', 6, 0.00, NULL, NULL),
('USD/MXN', 'USDMXN=X', 6, 0.00, NULL, NULL),
('USD/BRL', 'USDBRL=X', 6, 0.00, NULL, NULL),
('USD/CHF', 'USDCHF=X', 6, 0.00, NULL, NULL),
('USD/CAD', 'USDCAD=X', 6, 0.00, NULL, NULL),
('USD/CNY', 'USDCNY=X', 6, 0.00, NULL, NULL),

-- Materias Primas
('Oro', 'GC=F', 4, 0.00, NULL, NULL),
('Plata', 'SI=F', 4, 0.00, NULL, NULL),
('Cobre', 'HG=F', 4, 0.00, NULL, NULL),
('Petróleo WTI', 'CL=F', 4, 0.00, NULL, NULL),
('Petróleo Brent', 'BZ=F', 4, 0.00, NULL, NULL),
('Gas Natural', 'NG=F', 4, 0.00, NULL, NULL),
('Maíz', 'ZC=F', 4, 0.00, NULL, NULL),
('Trigo', 'ZW=F', 4, 0.00, NULL, NULL),
('Soja', 'ZS=F', 4, 0.00, NULL, NULL),

-- Bonos
('Bono del Tesoro EE.UU. 10 años', '^TNX', 3, 4.25, 'semestral', '2023-11-15'),
('Bono del Tesoro EE.UU. 30 años', '^TYX', 3, 4.50, 'semestral', '2023-11-15'),
('Bono del Tesoro EE.UU. 5 años', '^FVX', 3, 4.10, 'semestral', '2023-11-15'),
('Bono alemán 10 años', '^DE10Y', 3, 2.75, 'anual', '2023-10-15'),
('Bono japonés 10 años', '^JP10Y', 3, 0.85, 'semestral', '2023-09-20');


-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, email, contrasena) VALUES
('Juan Pérez', 'juan.perez@email.com', 'hash_contraseña_segura'),
('María García', 'maria.garcia@email.com', 'hash_contraseña_segura'),
('test', 'test@test.com', '$2b$10$bJ8KDFyIx8q99WrwBW23Zexwf0mc.BvF8VEYLGDY1pLpPXjb.yULO');

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
(4, 31, 5.00),   -- 5 unidades de SPY ETF
(4, 36, 0.25);   -- 0.25 Bitcoin

-- Insertar dividendos de ejemplo para los activos del usuario test (ID 3)
INSERT INTO dividendos (activo_id, monto, fecha_pago) VALUES
-- Dividendos de Apple (activo_id 1)
(1, 0.24, '2024-02-15 10:00:00'),  -- Dividendo trimestral de Apple
(1, 0.24, '2024-05-15 10:00:00'),  -- Próximo dividendo trimestral de Apple
(1, 0.25, '2024-08-15 10:00:00'),  -- Dividendo trimestral futuro con ligero aumento

-- Dividendos de Microsoft (activo_id 2)
(2, 0.68, '2024-03-10 10:00:00'),  -- Dividendo trimestral de Microsoft
(2, 0.68, '2024-06-10 10:00:00'),  -- Próximo dividendo trimestral de Microsoft

-- Dividendos de NVIDIA (activo_id 7)
(7, 0.04, '2024-03-25 10:00:00'),  -- Dividendo trimestral de NVIDIA
(7, 0.04, '2024-06-25 10:00:00'),  -- Próximo dividendo trimestral de NVIDIA

-- Dividendos de Visa (activo_id 11)
(11, 0.52, '2024-03-01 10:00:00'), -- Dividendo trimestral de Visa
(11, 0.52, '2024-06-01 10:00:00'), -- Próximo dividendo trimestral de Visa

-- Dividendos de SPY ETF (activo_id 31)
(31, 1.57, '2024-03-20 10:00:00'), -- Dividendo trimestral de SPY ETF
(31, 1.60, '2024-06-20 10:00:00')  -- Próximo dividendo trimestral de SPY ETF con ligero aumento

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