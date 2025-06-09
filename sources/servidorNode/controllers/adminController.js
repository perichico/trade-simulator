const { sequelize, Usuario, Transaccion, Portafolio } = require('../models/index');
const { Op } = require('sequelize');
const adminActivosController = require('./adminActivosController');

// Obtener todos los usuarios
const obtenerUsuarios = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER USUARIOS ===');
        console.log('Sesión:', req.session?.usuario?.nombre, 'Rol:', req.session?.usuario?.rol);
        
        // Validar sesión del usuario
        if (!req.session || !req.session.usuario) {
            console.log('❌ No hay sesión activa');
            return res.status(401).json({ error: 'No hay sesión activa' });
        }
        
        if (req.session.usuario.rol !== 'admin') {
            console.log('❌ Usuario no es administrador');
            return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        
        console.log('✅ Usuario admin autenticado:', req.session.usuario.nombre);
        
        // Consulta simplificada a la base de datos - removiendo createdAt
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'email', 'rol', 'estado', 'fechaRegistro'],
            order: [['id', 'ASC']]
        });
        
        console.log(`📊 Usuarios encontrados en DB: ${usuarios.length}`);
        
        // Verificar si hay usuarios
        if (!usuarios || usuarios.length === 0) {
            console.log('⚠️ No se encontraron usuarios en la base de datos');
            return res.status(200).json([]);
        }
        
        // Formatear datos para el frontend
        const usuariosFormateados = usuarios.map(usuario => ({
            id: usuario.id,
            nombre: usuario.nombre || 'Sin nombre',
            email: usuario.email || 'Sin email',
            rol: usuario.rol || 'usuario',
            estado: usuario.estado || 'activo',
            fechaRegistro: usuario.fechaRegistro || new Date()
        }));
        
        console.log(`✅ Enviando ${usuariosFormateados.length} usuarios formateados`);
        return res.status(200).json(usuariosFormateados);
        
    } catch (error) {
        console.error('❌ Error al obtener usuarios:', error);
        console.error('❌ Detalles del error:', error.message);
        return res.status(500).json({ 
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

// Cambiar estado de usuario (activo/suspendido)
const cambiarEstadoUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        if (!['activo', 'suspendido'].includes(estado)) {
            return res.status(400).json({ error: 'Estado inválido. Debe ser "activo" o "suspendido"' });
        }
        
        const usuario = await Usuario.findByPk(id);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Evitar que el administrador se suspenda a sí mismo
        if (usuario.id === req.session.usuario.id && estado === 'suspendido') {
            return res.status(400).json({ error: 'No puedes suspender tu propia cuenta' });
        }
        
        await usuario.update({ estado });
        
        res.json({ 
            message: `Usuario ${estado === 'activo' ? 'activado' : 'suspendido'} correctamente`,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                estado: usuario.estado
            }
        });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ error: 'Error al cambiar estado del usuario' });
    }
};

// Eliminar usuario
const eliminarUsuario = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        
        console.log(`Intentando eliminar usuario ID: ${id}`);
        
        const usuario = await Usuario.findByPk(id, { transaction });
        if (!usuario) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Evitar que el administrador se elimine a sí mismo
        if (usuario.id === req.session.usuario.id) {
            await transaction.rollback();
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }
        
        console.log(`Eliminando datos relacionados del usuario ${usuario.nombre}...`);
        
        // Eliminar datos relacionados en orden correcto
        // 1. Eliminar PortafolioActivo (activos en portafolios)
        const { PortafolioActivo } = require('../models/index');
        const portafolios = await Portafolio.findAll({ 
            where: { usuario_id: id },
            transaction 
        });
        
        for (const portafolio of portafolios) {
            await PortafolioActivo.destroy({ 
                where: { portafolio_id: portafolio.id },
                transaction 
            });
        }
        
        // 2. Eliminar transacciones
        await Transaccion.destroy({ 
            where: { usuario_id: id },
            transaction 
        });
        
        // 3. Eliminar portafolios
        await Portafolio.destroy({ 
            where: { usuario_id: id },
            transaction 
        });
        
        // 4. Eliminar usuario
        await usuario.destroy({ transaction });
        
        await transaction.commit();
        
        console.log(`Usuario ${usuario.nombre} eliminado correctamente`);
        
        res.json({ 
            message: `Usuario ${usuario.nombre} eliminado correctamente` 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ 
            error: 'Error al eliminar usuario',
            details: error.message 
        });
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
        
        console.log('📊 Consultando estadísticas con ORM...');
        
        // Calcular estadísticas usando ORM
        const [
            totalUsuarios,
            usuariosActivos,
            usuariosSuspendidos,
            administradores,
            totalTransacciones,
            totalPortafolios,
            usuariosHoy
        ] = await Promise.allSettled([
            Usuario.count(),
            Usuario.count({ where: { estado: 'activo' } }),
            Usuario.count({ where: { estado: 'suspendido' } }),
            Usuario.count({ where: { rol: 'admin' } }),
            Transaccion ? Transaccion.count() : Promise.resolve(0),
            Portafolio ? Portafolio.count() : Promise.resolve(0),
            Usuario.count({
                where: {
                    [Op.or]: [
                        {
                            fechaRegistro: {
                                [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                            }
                        },
                        {
                            createdAt: {
                                [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
                            }
                        }
                    ]
                }
            })
        ]);
        
        const estadisticas = {
            totalUsuarios: totalUsuarios.status === 'fulfilled' ? totalUsuarios.value : 0,
            usuariosActivos: usuariosActivos.status === 'fulfilled' ? usuariosActivos.value : 0,
            usuariosSuspendidos: usuariosSuspendidos.status === 'fulfilled' ? usuariosSuspendidos.value : 0,
            usuariosHoy: usuariosHoy.status === 'fulfilled' ? usuariosHoy.value : 0,
            administradores: administradores.status === 'fulfilled' ? administradores.value : 0,
            totalTransacciones: totalTransacciones.status === 'fulfilled' ? totalTransacciones.value : 0,
            totalPortafolios: totalPortafolios.status === 'fulfilled' ? totalPortafolios.value : 0
        };
        
        estadisticas.sistemaVacio = estadisticas.totalUsuarios === 0;
        estadisticas.mensaje = estadisticas.totalUsuarios === 0 ? 'Sistema sin usuarios registrados' : 'Sistema activo';
        
        console.log('✅ Estadísticas calculadas:', estadisticas);
        console.log('📤 Enviando respuesta...');
        
        res.status(200).json(estadisticas);
        console.log('✅ RESPUESTA ENVIADA EXITOSAMENTE');
        
    } catch (error) {
        console.log('=== ERROR EN OBTENER ESTADÍSTICAS ===');
        console.error('❌ Error completo:', error);
        console.error('❌ Mensaje:', error.message);
        
        res.status(500).json({ 
            error: 'Error al obtener estadísticas', 
            details: error.message
        });
    }
};

// Método para obtener dividendos para admin
const obtenerDividendos = async (req, res) => {
    try {
        console.log('AdminController: Obteniendo dividendos para admin...');
        console.log('AdminController: Usuario:', req.session?.usuario?.nombre, 'Rol:', req.session?.usuario?.rol);
        
        // Validar sesión y permisos
        if (!req.session || !req.session.usuario) {
            console.log('❌ No hay sesión activa');
            return res.status(401).json({ error: 'No hay sesión activa' });
        }
        
        if (req.session.usuario.rol !== 'admin') {
            console.log('❌ Usuario no es administrador');
            return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
        }
        
        // Verificar si los modelos están disponibles
        let Dividendo, Activo;
        try {
            const models = require('../models/index');
            Dividendo = models.Dividendo;
            Activo = models.Activo;
            
            if (!Dividendo || !Activo) {
                throw new Error('Modelos de Dividendo o Activo no encontrados');
            }
        } catch (modelError) {
            console.error('AdminController: Error al cargar modelos:', modelError);
            return res.status(500).json({ 
                error: "Error de configuración del servidor",
                mensaje: "Los modelos de datos no están disponibles"
            });
        }
        
        const dividendos = await Dividendo.findAll({
            include: [{ 
                model: Activo,
                attributes: ['id', 'simbolo', 'nombre', 'ultimo_precio']
            }],
            order: [["fecha", "DESC"]],
            limit: 100
        });
        
        console.log(`AdminController: Se obtuvieron ${dividendos.length} dividendos`);
        
        // Mapear los dividendos para asegurar consistencia
        const dividendosMapeados = dividendos.map(div => ({
            id: div.id,
            activo_id: div.activo_id,
            fecha: div.fecha,
            monto_por_accion: parseFloat(div.monto_por_accion),
            estado: div.estado,
            activo: div.Activo ? {
                id: div.Activo.id,
                simbolo: div.Activo.simbolo,
                nombre: div.Activo.nombre,
                ultimo_precio: div.Activo.ultimo_precio
            } : null
        }));
        
        res.status(200).json({
            success: true,
            data: dividendosMapeados,
            total: dividendosMapeados.length,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AdminController: Error al obtener dividendos:', error);
        res.status(500).json({ 
            error: "Error al obtener dividendos",
            mensaje: "Ha ocurrido un error interno del servidor",
            details: error.message
        });
    }
};

module.exports = {
    obtenerUsuarios,
    cambiarRolUsuario,
    cambiarEstadoUsuario,
    eliminarUsuario,
    obtenerEstadisticas,
    // Exportar funciones de gestión de activos
    obtenerActivos: adminActivosController.obtenerActivos,
    crearActivo: adminActivosController.crearActivo,
    actualizarActivo: adminActivosController.actualizarActivo,
    eliminarActivo: adminActivosController.eliminarActivo,
    obtenerEstadisticasActivos: adminActivosController.obtenerEstadisticasActivos,
    obtenerDividendos
};
