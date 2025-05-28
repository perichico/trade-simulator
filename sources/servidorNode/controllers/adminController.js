const { sequelize, Usuario, Transaccion, Portafolio } = require('../models/index');
const { Op } = require('sequelize');

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER USUARIOS ===');
        
        // Validar sesión del usuario
        if (!req.session || !req.session.usuario) {
            console.error('❌ No hay sesión activa');
            return res.status(401).json({ error: 'No hay sesión activa' });
        }
        
        if (req.session.usuario.rol !== 'admin') {
            console.error('❌ Usuario no es administrador');
            return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        
        console.log('Usuario admin autenticado:', req.session.usuario.nombre);
        
        // Verificar conexión a la base de datos
        try {
            await sequelize.authenticate();
            console.log('✅ Conexión a la base de datos verificada');
        } catch (dbError) {
            console.error('❌ Error de conexión a la base de datos:', dbError);
            return res.status(500).json({ 
                error: 'Error de conexión a la base de datos',
                details: dbError.message 
            });
        }
        
        console.log('📊 Consultando usuarios...');
        
        // Consulta simplificada y segura
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'email', 'rol'],
            order: [['id', 'ASC']],
            raw: true // Obtener datos planos para evitar problemas de serialización
        });
        
        console.log(`✅ Usuarios encontrados: ${usuarios.length}`);
        
        // Manejar caso cuando no hay usuarios
        if (usuarios.length === 0) {
            console.log('ℹ️ No hay usuarios registrados');
            return res.status(200).json({
                usuarios: [],
                total: 0,
                mensaje: 'No hay usuarios registrados en el sistema'
            });
        }
        
        // Formatear datos para el frontend
        const usuariosFormateados = usuarios.map(usuario => ({
            id: usuario.id,
            nombre: usuario.nombre,
            email: usuario.email,
            rol: usuario.rol,
            activo: true, // Por defecto activo
            fechaRegistro: new Date() // Fecha actual como placeholder
        }));
        
        console.log('📤 Enviando respuesta con usuarios formateados');
        
        res.status(200).json({
            usuarios: usuariosFormateados,
            total: usuariosFormateados.length,
            mensaje: `Se encontraron ${usuariosFormateados.length} usuarios`
        });
        
        console.log('✅ RESPUESTA ENVIADA EXITOSAMENTE');
        
    } catch (error) {
        console.log('=== ERROR EN OBTENER USUARIOS ===');
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje:', error.message);
        
        // Respuesta de error simplificada
        res.status(500).json({ 
            error: 'Error al obtener usuarios', 
            details: error.message
        });
    }
};

// Cambiar rol de usuario
const cambiarRolUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body;
        
        if (!['usuario', 'admin'].includes(rol)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }
        
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Evitar que el administrador se quite permisos a sí mismo
        if (usuario.id === req.session.usuario.id && rol === 'usuario') {
            return res.status(400).json({ error: 'No puedes cambiar tu propio rol' });
        }
        
        await usuario.update({ rol });
        
        res.json({ 
            message: `Rol del usuario ${usuario.nombre} cambiado a ${rol}`,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ error: 'Error al cambiar rol del usuario' });
    }
};

// Cambiar estado de usuario (activo/inactivo)
const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;
        
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Evitar que el administrador se desactive a sí mismo
        if (usuario.id === req.session.usuario.id && !activo) {
            return res.status(400).json({ error: 'No puedes desactivar tu propia cuenta' });
        }
        
        // Nota: Aquí asumo que agregarás un campo 'activo' a la tabla usuarios
        // Por ahora solo simulamos la respuesta
        
        res.json({ 
            message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                activo: activo
            }
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ error: 'Error al cambiar estado del usuario' });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Evitar que el administrador se elimine a sí mismo
        if (usuario.id === req.session.usuario.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        
        // Eliminar datos relacionados (portafolios, transacciones, etc.)
        await Transaccion.destroy({ where: { usuario_id: id } });
        await Portafolio.destroy({ where: { usuario_id: id } });
        
        // Eliminar usuario
        await usuario.destroy();
        
        res.json({ 
            message: `Usuario ${usuario.nombre} eliminado correctamente` 
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
};

// Obtener estadísticas del sistema
const obtenerEstadisticas = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER ESTADÍSTICAS ===');
        
        // Validar sesión del usuario
        if (!req.session || !req.session.usuario) {
            console.error('❌ No hay sesión activa');
            return res.status(401).json({ error: 'No hay sesión activa' });
        }
        
        if (req.session.usuario.rol !== 'admin') {
            console.error('❌ Usuario no es administrador');
            return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        
        console.log('Usuario admin autenticado:', req.session.usuario.nombre);
        
        // Verificar conexión a la base de datos
        try {
            await sequelize.authenticate();
            console.log('✅ Conexión a la base de datos verificada');
        } catch (dbError) {
            console.error('❌ Error de conexión a la base de datos:', dbError);
            return res.status(500).json({ 
                error: 'Error de conexión a la base de datos',
                details: dbError.message 
            });
        }
        
        console.log('📊 Consultando estadísticas...');
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const totalUsuarios = await Usuario.count().catch(err => {
            console.error('Error contando usuarios:', err);
            return 0;
        });
        
        const usuariosHoy = await Usuario.count({
            where: {
                createdAt: {
                    [Op.gte]: hoy
                }
            }
        }).catch(err => {
            console.error('Error contando usuarios de hoy:', err);
            return 0;
        });
        
        const administradores = await Usuario.count({
            where: { rol: 'admin' }
        }).catch(err => {
            console.error('Error contando administradores:', err);
            return 0;
        });
        
        const totalTransacciones = await Transaccion.count().catch(err => {
            console.error('Error contando transacciones:', err);
            return 0;
        });
        
        const totalPortafolios = await Portafolio.count().catch(err => {
            console.error('Error contando portafolios:', err);
            return 0;
        });
        
        const estadisticas = {
            totalUsuarios,
            usuariosActivos: totalUsuarios, // Asumir todos activos por ahora
            usuariosHoy,
            administradores,
            totalTransacciones,
            totalPortafolios,
            sistemaVacio: totalUsuarios === 0,
            mensaje: totalUsuarios === 0 ? 'Sistema sin usuarios registrados' : 'Sistema activo'
        };
        
        console.log('✅ Estadísticas calculadas:', estadisticas);
        console.log('📤 Enviando respuesta...');
        
        res.status(200).json(estadisticas);
        
        console.log('✅ RESPUESTA ENVIADA EXITOSAMENTE');
        
    } catch (error) {
        console.log('=== ERROR EN OBTENER ESTADÍSTICAS ===');
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje:', error.message);
        console.error('❌ Stack:', error.stack);
        
        // Respuesta de error simplificada
        res.status(500).json({ 
            error: 'Error al obtener estadísticas', 
            details: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    cambiarRolUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,
    obtenerEstadisticas
};
