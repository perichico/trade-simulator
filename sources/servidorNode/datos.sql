-- Crear tabla de usuarios
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 10000.00,
    contrasena VARCHAR(255) NOT NULL
);


-- Crear tabla de activos
CREATE TABLE activos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    simbolo VARCHAR(50) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL
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

-- Insertar activos
INSERT INTO activos (nombre, simbolo, precio) VALUES
('Apple', 'AAPL', 150.00),
('Microsoft', 'MSFT', 280.00),
('Tesla', 'TSLA', 650.00),
('Amazon', 'AMZN', 3400.00),
('Google (Alphabet)', 'GOOGL', 2800.00),
('Meta (Facebook)', 'META', 350.00),
('Nvidia', 'NVDA', 220.00),
('Netflix', 'NFLX', 600.00),
('Intel', 'INTC', 60.00),
('AMD', 'AMD', 100.00),
('Visa', 'V', 220.00),
('Mastercard', 'MA', 370.00),
('Johnson & Johnson', 'JNJ', 170.00),
('Coca-Cola', 'KO', 55.00),
('PepsiCo', 'PEP', 150.00),
('Berkshire Hathaway', 'BRK-B', 420.00),
('ExxonMobil', 'XOM', 65.00),
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

