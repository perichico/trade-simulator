const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

router.get("/", usuarioController.mostrarLogin);
router.post("/login", usuarioController.procesarLogin);
router.get("/logout", usuarioController.logout);
router.get("/dashboard", usuarioController.mostrarDashboard);

router.get("/registro", usuarioController.mostrarRegistro);
router.post("/registro", usuarioController.registrarUsuario);

module.exports = router;
