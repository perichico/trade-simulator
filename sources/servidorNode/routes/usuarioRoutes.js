const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");
const { verificarAutenticacion, verificarAdmin } = require("../middleware/authMiddleware");

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
router.get("/perfil", verificarAutenticacion, usuarioController.obtenerPerfil);

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
