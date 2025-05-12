const { Activo, Dividendo } = require('../models/index');
const DividendoService = require('../services/dividendoService');

const dividendoService = new DividendoService();

// Obtener todos los dividendos
exports.obtenerDividendos = async (req, res) => {
  try {
    const dividendos = await Dividendo.findAll({
      include: [{ model: Activo }],
      order: [["fecha", "DESC"]]
    });
    
    res.status(200).json(dividendos);
  } catch (error) {
    console.error('Error al obtener dividendos:', error);
    res.status(500).json({ error: "Error al obtener dividendos" });
  }
};

// Obtener dividendos de un usuario específico
exports.obtenerDividendosPorUsuario = async (req, res) => {
  try {
    // Verificar si el usuario está autenticado
    if (!req.session.usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    const usuarioId = req.session.usuario.id;
    
    const dividendos = await dividendoService.obtenerDividendosPorUsuario(usuarioId);
    res.status(200).json(dividendos);
  } catch (error) {
    console.error('Error al obtener dividendos del usuario:', error);
    res.status(500).json({ error: "Error al obtener dividendos del usuario" });
  }
};

// Procesar dividendos automáticos (para uso del sistema o admin)
exports.procesarDividendosAutomaticos = async (req, res) => {
  try {
    const dividendos = await dividendoService.procesarDividendosAutomaticos();
    res.status(200).json({
      mensaje: `Se han procesado ${dividendos.length} dividendos automáticos`,
      dividendos
    });
  } catch (error) {
    console.error('Error al procesar dividendos automáticos:', error);
    res.status(500).json({ error: "Error al procesar dividendos automáticos" });
  }
};