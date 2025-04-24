const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.get("/", usuarioController.mostrarLogin);
router.post("/login", usuarioController.procesarLogin);
router.get("/logout", usuarioController.logout);
router.get("/dashboard", usuarioController.mostrarDashboard);

router.get("/registro", usuarioController.mostrarRegistro);
router.post("/registro", usuarioController.registrarUsuario);

// Endpoint para obtener el historial de patrimonio del usuario
router.get("/historial-patrimonio/:usuarioId", usuarioController.obtenerHistorialPatrimonio);
module.exports = router;
