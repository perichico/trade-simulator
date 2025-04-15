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
    simbolo VARCHAR(50) NOT NULL,
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
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Crear tabla de portafolio_activo
CREATE TABLE portafolio_activo (
    portafolio_id INT NOT NULL,
    activo_id INT NOT NULL,
    cantidad INT NOT NULL,
    PRIMARY KEY (portafolio_id, activo_id),
    FOREIGN KEY (portafolio_id) REFERENCES portafolio(id) ON DELETE CASCADE,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
);

-- Crear tabla de historial_precios
CREATE TABLE historial_precios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    activo_id INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    FOREIGN KEY (activo_id) REFERENCES activos(id) ON DELETE CASCADE
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
    cantidad INT NOT NULL,
    precio_limite DECIMAL(10, 2),
    estado ENUM('pendiente', 'ejecutada', 'cancelada') NOT NULL,
    fecha_creacion DATETIME NOT NULL,
    fecha_ejecucion DATETIME,
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
    usuarioId INT NOT NULL,
    activoId INT NOT NULL,
    cantidad INT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    fecha DATETIME NOT NULL,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (activoId) REFERENCES activos(id) ON DELETE CASCADE
);

-- Insertar tipos de activo
INSERT INTO tipo_activo (nombre, descripcion) VALUES
('Acciones', 'Títulos de renta variable que representan una parte del capital de una empresa'),
('ETFs', 'Fondos cotizados que siguen índices o sectores específicos'),
('Bonos', 'Títulos de deuda que pagan intereses'),
('Materias Primas', 'Commodities y recursos naturales'),
('Criptomonedas', 'Activos digitales basados en blockchain');

-- Insertar activos
INSERT INTO activos (nombre, simbolo, precio, tipo_activo_id) VALUES
('Apple', 'AAPL', 150.00, 1),
('Microsoft', 'MSFT', 280.00, 1),
('Tesla', 'TSLA', 650.00, 1),
('Amazon', 'AMZN', 3400.00, 1),
('Google (Alphabet)', 'GOOGL', 2800.00, 1),
('Meta (Facebook)', 'META', 350.00, 1),
('Nvidia', 'NVDA', 220.00, 1),
('Netflix', 'NFLX', 600.00, 1),
('Intel', 'INTC', 60.00, 1),
('AMD', 'AMD', 100.00, 1),
('Visa', 'V', 220.00, 1),
('Mastercard', 'MA', 370.00, 1),
('Johnson & Johnson', 'JNJ', 170.00, 1),
('Coca-Cola', 'KO', 55.00, 1),
('PepsiCo', 'PEP', 150.00, 1),
('Berkshire Hathaway', 'BRK-B', 420.00, 1),
('ExxonMobil', 'XOM', 65.00, 1),
('Chevron', 'CVX', 110.00),
('Walmart', 'WMT', 140.00),
('McDonald\'s', 'MCD', 230.00),
('S&P 500', '^GSPC', 4500.00),
('Dow Jones', '^DJI', 35000.00),
('Nasdaq 100', '^NDX', 15000.00),
('Russell 2000', '^RUT', 2300.00),
('DAX (Alemania)', '^GDAXI', 16000.00),
('IBEX 35 (España)', '^IBEX', 9000.00),
('FTSE 100 (Reino Unido)', '^FTSE', 7300.00),
('CAC 40 (Francia)', '^FCHI', 7000.00),
('Nikkei 225 (Japón)', '^N225', 29000.00),
('Hang Seng (Hong Kong)', '^HSI', 25000.00),
('Bitcoin', 'BTC-USD', 50000.00),
('Ethereum', 'ETH-USD', 4000.00),
('Cardano', 'ADA-USD', 1.20),
('Solana', 'SOL-USD', 180.00),
('XRP', 'XRP-USD', 1.00),
('Binance Coin', 'BNB-USD', 400.00),
('Dogecoin', 'DOGE-USD', 0.30),
('Polkadot', 'DOT-USD', 30.00),
('Shiba Inu', 'SHIB-USD', 0.00007),
('Litecoin', 'LTC-USD', 180.00),
('Euro/Dólar', 'EURUSD=X', 1.18),
('Dólar/Yen', 'USDJPY=X', 110.00),
('Libra/Dólar', 'GBPUSD=X', 1.35),
('Dólar/Peso MXN', 'USDMXN=X', 20.00),
('Dólar/Real BRL', 'USDBRL=X', 5.40),
('Dólar/Franco Suizo', 'USDCHF=X', 0.92),
('Dólar/Dólar Canadiense', 'USDCAD=X', 1.25),
('Dólar/Yuan Chino', 'USDCNY=X', 6.40),
('Oro', 'GC=F', 1800.00),
('Plata', 'SI=F', 25.00),
('Cobre', 'HG=F', 4.00),
('Petróleo WTI', 'CL=F', 75.00),
('Petróleo Brent', 'BZ=F', 80.00),
('Gas Natural', 'NG=F', 5.00),
('Maíz', 'ZC=F', 550.00),
('Trigo', 'ZW=F', 700.00),
('Soja', 'ZS=F', 1400.00),
('Bono del Tesoro EE.UU. 10 años', '^TNX', 1.40),
('Bono del Tesoro EE.UU. 30 años', '^TYX', 2.00),
('Bono del Tesoro EE.UU. 5 años', '^FVX', 0.90),
('Bono alemán 10 años', '^DE10Y', 0.50),
('Bono japonés 10 años', '^JP10Y', 0.10),
('SPDR S&P 500 ETF', 'SPY', 450.00),
('Invesco QQQ Trust', 'QQQ', 370.00),
('Vanguard Total Stock Market ETF', 'VTI', 220.00),
('iShares MSCI Emerging Markets ETF', 'EEM', 50.00),
('ARK Innovation ETF', 'ARKK', 130.00);

-- Insertar usuarios
INSERT INTO usuarios (nombre, email, balance, contrasena) VALUES
('Juan Pérez', 'juan.perez@gmail.com', 10000.00, '1234'),
('María López', 'maria.lopez@gmail.com', 15000.00, '1234'),
('Carlos García', 'carlos.garcia@yahoo.com', 12000.00, '1234'),
('Laura Martínez', 'laura.martinez@hotmail.com', 5000.00, '1234'),
('Luis Sánchez', 'luis.sanchez@outlook.com', 20000.00, '1234');


-- Insertar portafolios
INSERT INTO portafolio (nombre, usuario_id) VALUES
('Portafolio Principal', 1),
('Inversiones Tech', 2),
('Cartera Conservadora', 3),
('Trading Activo', 4),
('Largo Plazo', 5);

-- Insertar portafolio_activo
INSERT INTO portafolio_activo (portafolio_id, activo_id, cantidad) VALUES
(1, 1, 10),
(1, 2, 5),
(2, 3, 2),
(3, 4, 1),
(4, 5, 15);

-- Insertar historial_precios
INSERT INTO historial_precios (activo_id, precio, fecha) VALUES
(1, 148.50, '2025-02-25 16:00:00'),
(1, 150.00, '2025-02-26 16:00:00'),
(2, 278.00, '2025-02-25 16:00:00'),
(2, 280.00, '2025-02-26 16:00:00');

-- Insertar dividendos
INSERT INTO dividendos (activo_id, monto, fecha_pago) VALUES
(1, 0.88, '2025-03-15 00:00:00'),
(2, 0.75, '2025-03-10 00:00:00');

-- Insertar ordenes
INSERT INTO ordenes (usuario_id, activo_id, tipo, cantidad, precio_limite, estado, fecha_creacion, fecha_ejecucion) VALUES
(1, 1, 'compra', 10, 150.00, 'ejecutada', '2025-02-26 09:00:00', '2025-02-26 09:00:00'),
(2, 2, 'compra', 5, 280.00, 'ejecutada', '2025-02-26 09:10:00', '2025-02-26 09:10:00'),
(3, 3, 'venta', 2, 650.00, 'pendiente', '2025-02-26 09:15:00', NULL);

-- Insertar alertas
INSERT INTO alertas (usuario_id, activo_id, precio_objetivo, condicion, estado, fecha_creacion, fecha_disparo) VALUES
(1, 1, 155.00, 'mayor', 'activa', '2025-02-26 00:00:00', NULL),
(2, 2, 275.00, 'menor', 'activa', '2025-02-26 00:00:00', NULL);

-- Insertar transacciones
INSERT INTO transacciones (usuarioId, activoId, cantidad, precio, fecha) VALUES
(1, 1, 10, 150.00, '2025-02-26 09:00:00'), -- Juan Pérez compra 10 acciones de Apple
(1, 2, 5, 280.00, '2025-02-26 09:10:00'), -- Juan Pérez compra 5 acciones de Microsoft
(2, 3, 2, 650.00, '2025-02-26 09:15:00'), -- María López compra 2 acciones de Tesla
(3, 4, 1, 3400.00, '2025-02-26 09:30:00'), -- Carlos García compra 1 acción de Amazon
(4, 5, 15, 350.00, '2025-02-26 09:45:00'), -- Laura Martínez compra 15 acciones de Meta
(5, 6, 20, 220.00, '2025-02-26 10:00:00'); -- Luis Sánchez compra 20 acciones de Nvidia

-- Borrar todas las tablas
-- DROP TABLE usuarios;
-- DROP TABLE activos;
-- DROP TABLE transacciones;

