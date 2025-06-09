const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:4200', // URL de tu frontend
  credentials: true // Permitir cookies y credenciales
}));

// Configuración de sesiones
app.use(session({
  secret: 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // Cambiar a true en producción con HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Middleware de logging para dividendos
app.use('/api/dividendos*', (req, res, next) => {
  console.log(`💰 Ruta de dividendos: ${req.method} ${req.originalUrl}`);
  console.log('Session ID:', req.sessionID);
  console.log('Usuario:', req.session?.usuario?.nombre || 'No autenticado');
  next();
});

// Rutas
const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuario');
const adminRoutes = require('./routes/admin');
const dividendoRoutes = require('./routes/dividendoRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/usuario', usuarioRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/dividendos', dividendoRoutes);

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});