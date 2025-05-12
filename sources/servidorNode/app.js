const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");

// Importar la instancia de sequelize desde models/index.js
const { sequelize } = require('./models/index');
const DividendoService = require('./services/dividendoService');
const GeneradorDividendosService = require("./services/generadorDividendosService");

const usuarioRoutes = require("./routes/usuarioRoutes");
const activoRoutes = require("./routes/activoRoutes");
const transaccionRoutes = require("./routes/transaccionRoutes");
const historialPreciosRoutes = require("./routes/historialPreciosRoutes");
const portafolioRoutes = require("./routes/portafolioRoutes");
const dividendoRoutes = require('./routes/dividendoRoutes');

const app = express();

// Configuración de CORS para Angular
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true
}));

console.log(`CORS configurado para: ${process.env.CORS_ORIGIN || 'http://localhost:4200'}`);

// Configuración básica
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

// Configuración de sesión
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Rutas
app.use("/", usuarioRoutes);
app.use("/activos", activoRoutes);
app.use("/transacciones", transaccionRoutes);
app.use("/historial-precios", historialPreciosRoutes);
app.use("/portafolio", portafolioRoutes);
app.use('/api/dividendos', dividendoRoutes);

// Inicializar servicios después de que la aplicación esté lista
app.on('ready', async () => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    console.log('Conexión exitosa a la base de datos');
    
    // Iniciar los servicios necesarios
    const dividendoService = new DividendoService();
    await dividendoService.iniciarServicio().catch(err => {
      console.error('Error al iniciar el servicio de dividendos:', err);
    });
  } catch (err) {
    console.error('Error al iniciar servicios:', err);
  }
});

// Emitir evento 'ready' después de configurar todo
setTimeout(() => {
  app.emit('ready');
}, 1000);

// Iniciar servicio de generación automática de dividendos
const generadorDividendos = new GeneradorDividendosService();
generadorDividendos.iniciarServicio();

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).send("Error interno del servidor");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
