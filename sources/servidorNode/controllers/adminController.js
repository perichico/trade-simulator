const { Usuario } = require('../models');

const panelAdmin = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        res.render('admin/panel', { 
            usuarios,
            usuario: req.session.usuario 
        });
    } catch (error) {
        console.error('Error al cargar panel admin:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const gestionarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.findAll();
        res.render('admin/usuarios', { 
            usuarios,
            usuario: req.session.usuario 
        });
    } catch (error) {
        console.error('Error al cargar usuarios:', error);
        res.status(500).send('Error interno del servidor');
    }
};

const cambiarRolUsuario = async (req, res) => {
    try {
        const { id, nuevoRol } = req.body;
        
        await Usuario.update(
            { rol: nuevoRol },
            { where: { id: id } }
        );
        
        res.redirect('/admin/usuarios');
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).send('Error interno del servidor');
    }
};

module.exports = {
    panelAdmin,
    gestionarUsuarios,
    cambiarRolUsuario
};
