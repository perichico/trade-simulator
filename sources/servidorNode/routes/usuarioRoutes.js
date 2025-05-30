const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  next();
};

// Middleware de verificación de admin
const verificarAdmin = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  
  if (req.session.usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  
  next();
};

// Rutas públicas
router.get("/", usuarioController.mostrarLogin);
router.post("/login", usuarioController.procesarLogin);
router.get("/logout", usuarioController.logout);
router.get("/verificar-sesion", usuarioController.verificarAutenticacion);
router.get("/registro", usuarioController.mostrarRegistro);
router.post("/registro", usuarioController.registrarUsuario);

// Rutas protegidas que requieren autenticación
router.get("/dashboard", verificarAutenticacion, usuarioController.mostrarDashboard);
router.get("/historial-patrimonio/:usuarioId", verificarAutenticacion, usuarioController.obtenerHistorialPatrimonio);

// Rutas de administración
router.get("/admin/usuarios", verificarAdmin, (req, res) => {
  // Redirigir a la ruta del API de admin
  res.redirect('/api/admin/usuarios');
});

router.get("/admin/estadisticas", verificarAdmin, (req, res) => {
  // Redirigir a la ruta del API de admin
  res.redirect('/api/admin/estadisticas');
});

module.exports = router;
