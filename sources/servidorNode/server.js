const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:4200', // URL de tu frontend
  credentials: true // Habilitar el envío de cookies y encabezados de autorización
}));

// Middleware para parsear cookies
app.use(cookieParser());

// Middleware para manejar sesiones
app.use(session({
  secret: 'tu_secreto_aqui',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: false, // Cambiar a true en producción con HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
// ...otras importaciones de rutas

// Configurar rutas
app.use('/api', authRoutes);
app.use('/api/admin', adminRoutes);
// ...otras configuraciones de rutas

// Servir archivos estáticos desde el directorio 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Manejo de errores 404
app.use((req, res, next) => {
  res.status(404).json({ error: 'Recurso no encontrado' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error('Error interno del servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;