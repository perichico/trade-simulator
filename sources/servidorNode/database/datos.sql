-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
    contrasena VARCHAR(255) NOT NULL
);

-- Crear tabla de tipo_activo
CREATE TABLE tipo_activo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT
);

-- Crear tabla de activos
CREATE TABLE activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    simbolo VARCHAR(50) NOT NULL UNIQUE,
    tipo_activo_id INT NOT NULL,
    ultimo_precio DECIMAL(10, 2),
    ultima_actualizacion DATETIME,
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
INSERT INTO activos (nombre, simbolo, tipo_activo_id) VALUES
-- Acciones de empresas populares
('Apple Inc.', 'AAPL', 1),
('Microsoft Corporation', 'MSFT', 1),
('Tesla, Inc.', 'TSLA', 1),
('Amazon.com Inc.', 'AMZN', 1),
('Alphabet Inc.', 'GOOGL', 1),
('Meta Platforms Inc.', 'META', 1),
('NVIDIA Corporation', 'NVDA', 1),
('Netflix Inc.', 'NFLX', 1),
('Intel Corporation', 'INTC', 1),
('Advanced Micro Devices Inc.', 'AMD', 1),
('Visa Inc.', 'V', 1),
('Mastercard Inc.', 'MA', 1),
('Johnson & Johnson', 'JNJ', 1),
('Coca-Cola Company', 'KO', 1),
('PepsiCo Inc.', 'PEP', 1),
('Berkshire Hathaway Inc.', 'BRK-B', 1),
('ExxonMobil Corporation', 'XOM', 1),
('Chevron Corporation', 'CVX', 1),
('Walmart Inc.', 'WMT', 1),
('McDonalds Corporation', 'MCD', 1),

-- Índices bursátiles
('S&P 500', '^GSPC', 2),
('Dow Jones Industrial Average', '^DJI', 2),
('Nasdaq 100', '^NDX', 2),
('Russell 2000', '^RUT', 2),
('DAX', '^GDAXI', 2),
('IBEX 35', '^IBEX', 2),
('FTSE 100', '^FTSE', 2),
('CAC 40', '^FCHI', 2),
('Nikkei 225', '^N225', 2),
('Hang Seng', '^HSI', 2),

-- ETFs
('SPDR S&P 500 ETF', 'SPY', 2),
('Invesco QQQ Trust', 'QQQ', 2),
('Vanguard Total Stock Market ETF', 'VTI', 2),
('iShares MSCI Emerging Markets ETF', 'EEM', 2),
('ARK Innovation ETF', 'ARKK', 2),

-- Criptomonedas
('Bitcoin USD', 'BTC-USD', 5),
('Ethereum USD', 'ETH-USD', 5),
('Cardano USD', 'ADA-USD', 5),
('Solana USD', 'SOL-USD', 5),
('XRP USD', 'XRP-USD', 5),
('Binance Coin USD', 'BNB-USD', 5),
('Dogecoin USD', 'DOGE-USD', 5),
('Polkadot USD', 'DOT-USD', 5),
('Shiba Inu USD', 'SHIB-USD', 5),
('Litecoin USD', 'LTC-USD', 5),

-- Forex
('EUR/USD', 'EURUSD=X', 6),
('USD/JPY', 'USDJPY=X', 6),
('GBP/USD', 'GBPUSD=X', 6),
('USD/MXN', 'USDMXN=X', 6),
('USD/BRL', 'USDBRL=X', 6),
('USD/CHF', 'USDCHF=X', 6),
('USD/CAD', 'USDCAD=X', 6),
('USD/CNY', 'USDCNY=X', 6),

-- Materias Primas
('Oro', 'GC=F', 4),
('Plata', 'SI=F', 4),
('Cobre', 'HG=F', 4),
('Petróleo WTI', 'CL=F', 4),
('Petróleo Brent', 'BZ=F', 4),
('Gas Natural', 'NG=F', 4),
('Maíz', 'ZC=F', 4),
('Trigo', 'ZW=F', 4),
('Soja', 'ZS=F', 4),

-- Bonos
('Bono del Tesoro EE.UU. 10 años', '^TNX', 3),
('Bono del Tesoro EE.UU. 30 años', '^TYX', 3),
('Bono del Tesoro EE.UU. 5 años', '^FVX', 3),
('Bono alemán 10 años', '^DE10Y', 3),
('Bono japonés 10 años', '^JP10Y', 3);


-- Insertar usuarios de prueba
INSERT INTO usuarios (nombre, email, balance, contrasena) VALUES
('Juan Pérez', 'juan.perez@email.com', 50000.00, 'hash_contraseña_segura'),
('María García', 'maria.garcia@email.com', 75000.00, 'hash_contraseña_segura');

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