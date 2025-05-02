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
module.exports = router;
