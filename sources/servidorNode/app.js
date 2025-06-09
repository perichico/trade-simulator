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
const alertasRoutes = require('./routes/alertas.routes');
const adminRoutes = require('./routes/adminRoutes');
const adminActivosRoutes = require('./routes/adminActivosRoutes');
const patrimonioRoutes = require('./routes/patrimonioRoutes');

const app = express();

// Configuración de CORS para Angular
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
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
        secure: false, // Cambiar a true solo en producción con HTTPS
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 horas
    }
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Rutas
app.use("/", usuarioRoutes);
app.use("/activos", activoRoutes);
app.use("/transacciones", transaccionRoutes);
app.use("/historial-precios", historialPreciosRoutes);
app.use("/portafolio", portafolioRoutes);
app.use('/api/dividendos', dividendoRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/patrimonio', patrimonioRoutes);
app.use('/api/admin', (req, res, next) => {
  console.log('🔗 Acceso a ruta /api/admin:', req.method, req.url);
  console.log('🔗 URL original:', req.originalUrl);
  console.log('🔗 Headers:', req.headers);
  next();
}, adminRoutes);
app.use('/api/admin', adminActivosRoutes);

// Middleware para logging específico de dividendos
app.use('/api/dividendos*', (req, res, next) => {
  console.log(`💰 Ruta de dividendos: ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware para logging de todas las rutas (incluir logging de activos)
app.use('*', (req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} - ${new Date().toISOString()}`);
  console.log('📝 Session ID:', req.sessionID);
  console.log('👤 Usuario:', req.session?.usuario?.nombre || 'No autenticado');
  
  // Log específico para rutas de activos
  if (req.originalUrl.includes('activos')) {
    console.log('📊 Ruta de activos detectada:', req.originalUrl);
  }
  
  // Si llegamos aquí, la ruta no fue encontrada
  if (res.headersSent) return next();
  
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Recurso no encontrado', ruta: req.originalUrl });
});

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
setTimeout(async () => {
  app.emit('ready');
  
  // Crear algunos dividendos de prueba si no existen
  try {
    const { Dividendo, Activo } = require('./models/index');
    const dividendosExistentes = await Dividendo.count();
    
    if (dividendosExistentes === 0) {
      console.log('🔧 Creando dividendos de prueba...');
      
      // Buscar activos que tengan configuración de dividendos
      const activos = await Activo.findAll({ 
        where: {
          porcentaje_dividendo: { [Op.gt]: 0 }
        },
        limit: 3 
      });
      
      if (activos.length === 0) {
        // Si no hay activos con dividendos, crear algunos básicos
        console.log('🔧 No hay activos con dividendos, creando activos básicos...');
        const activosBasicos = await Activo.findAll({ limit: 3 });
        
        for (const activo of activosBasicos) {
          // Actualizar el activo para que tenga dividendos
          await activo.update({
            porcentaje_dividendo: 3.5, // 3.5% anual
            frecuencia_dividendo: 'trimestral'
          });
          
          // Crear dividendos de prueba
          await Dividendo.create({
            activo_id: activo.id,
            fecha: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
            monto_por_accion: (activo.ultimo_precio * 0.00875), // ~0.875% trimestral
            estado: 'pagado'
          });
          
          await Dividendo.create({
            activo_id: activo.id,
            fecha: new Date(),
            monto_por_accion: (activo.ultimo_precio * 0.00875),
            estado: 'pendiente'
          });
        }
      } else {
        // Crear dividendos para activos que ya tienen configuración
        for (const activo of activos) {
          const montoPorAccion = (activo.ultimo_precio * activo.porcentaje_dividendo / 100) / 4; // Trimestral
          
          await Dividendo.create({
            activo_id: activo.id,
            fecha: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
            monto_por_accion: montoPorAccion,
            estado: 'pagado'
          });
          
          await Dividendo.create({
            activo_id: activo.id,
            fecha: new Date(),
            monto_por_accion: montoPorAccion,
            estado: 'pendiente'
          });
        }
      }
      
      console.log('✅ Dividendos de prueba creados');
    }
  } catch (error) {
    console.error('Error al crear dividendos de prueba:', error);
  }
}, 2000);

// Iniciar servicio de generación automática de dividendos
const generadorDividendos = new GeneradorDividendosService();
generadorDividendos.iniciarServicio();

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Configuración del puerto y inicio del servidor
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app;
