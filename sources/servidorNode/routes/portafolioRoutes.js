const express = require("express");
const router = express.Router();
const portafolioController = require("../controllers/portafolioController");

// Middleware de autenticación
const verificarAutenticacion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }
  next();
};

// Rutas protegidas que requieren autenticación
// Obtener todos los portafolios del usuario
router.get("/usuario/:id", verificarAutenticacion, portafolioController.obtenerPortafoliosUsuario);

// Obtener un portafolio específico por su ID
router.get("/:id", verificarAutenticacion, portafolioController.obtenerPortafolio);

// Crear un nuevo portafolio
router.post("/crear", verificarAutenticacion, portafolioController.crearPortafolio);

// Seleccionar un portafolio como activo
router.post("/seleccionar/:id", verificarAutenticacion, portafolioController.seleccionarPortafolio);

module.exports = router;