const { Activo } = require('../models/activoModel');

//Gestion de Activos
const obtenerActivos = async (req, res) => {
    try {
        const activos = await Activo.findAll();
        res.render('listadoActivos', { activos }); 
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const obtenerActivo = async (req, res) => {  //Devuelve un activo especifico
    try {
        const activo = await Activo.findByPk(req.params.id, {
            include: [{ model: Activo }]
        });
        if (activo) {
            res.render('verActivo', { activo }); 
        } else {
            res.status(404).json({ error: 'Activo no encontrado' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Exportación de los Controladores
module.exports = {
    obtenerActivos,
    obtenerActivo
};