const { sequelize, Activo, TipoActivo, Transaccion, HistorialPrecios } = require('../models/index');
const { Op } = require('sequelize');

// Obtener todos los activos para administración
const obtenerActivos = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER ACTIVOS ADMIN ===');
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
        
        // Consulta de activos con información completa incluyendo tipo
        const activos = await Activo.findAll({
            include: [{
                model: TipoActivo,
                attributes: ['id', 'nombre'],
                required: false
            }],
            order: [['id', 'ASC']]
        });
        
        console.log(`📊 Activos encontrados en DB: ${activos.length}`);
        
        // Verificar si hay activos
        if (!activos || activos.length === 0) {
            console.log('⚠️ No se encontraron activos en la base de datos');
            return res.status(200).json([]);
        }
        
        // Formatear datos completos para el frontend
        const activosFormateados = activos.map(activo => ({
            id: activo.id,
            nombre: activo.nombre || 'Sin nombre',
            simbolo: activo.simbolo || 'Sin símbolo',
            tipoActivo: activo.TipoActivo ? activo.TipoActivo.nombre : 'Sin tipo',
            tipoActivoId: activo.tipo_activo_id,
            ultimoPrecio: activo.ultimo_precio || 0,
            ultimaActualizacion: activo.ultima_actualizacion || new Date(),
            porcentajeDividendo: activo.porcentaje_dividendo || 0,
            frecuenciaDividendo: activo.frecuencia_dividendo || 'trimestral',
            ultimaFechaDividendo: activo.ultima_fecha_dividendo || null,
            // Información adicional para análisis
            tieneDividendos: (activo.porcentaje_dividendo || 0) > 0,
            diasSinActualizar: activo.ultima_actualizacion ? 
                Math.floor((new Date() - new Date(activo.ultima_actualizacion)) / (1000 * 60 * 60 * 24)) : 0
        }));
        
        console.log(`✅ Enviando ${activosFormateados.length} activos completos formateados`);
        return res.status(200).json(activosFormateados);
        
    } catch (error) {
        console.error('❌ Error al obtener activos:', error);
        console.error('❌ Detalles del error:', error.message);
        return res.status(500).json({ 
            error: 'Error al obtener activos', 
            details: error.message
        });
    }
};

// Crear nuevo activo
const crearActivo = async (req, res) => {
    try {
        const { nombre, simbolo, tipoActivoId, porcentajeDividendo, frecuenciaDividendo } = req.body;
        
        if (!nombre || !simbolo || !tipoActivoId) {
            return res.status(400).json({ error: 'Faltan datos requeridos: nombre, símbolo y tipo de activo' });
        }
        
        // Verificar que el símbolo no exista
        const simboloExistente = await Activo.findOne({ where: { simbolo } });
        if (simboloExistente) {
            return res.status(400).json({ error: 'El símbolo ya existe' });
        }
        
        // Obtener precio inicial (simulado o de API externa)
        const precioInicial = 100.00; // Precio por defecto, en producción vendría de una API
        
        const nuevoActivo = await Activo.create({
            nombre,
            simbolo,
            tipo_activo_id: tipoActivoId,
            ultimo_precio: precioInicial,
            ultima_actualizacion: new Date(),
            porcentaje_dividendo: porcentajeDividendo || 0,
            frecuencia_dividendo: frecuenciaDividendo || 'trimestral',
            ultima_fecha_dividendo: null
        });
        
        res.status(201).json({
            message: `Activo ${nombre} creado correctamente`,
            activo: nuevoActivo
        });
    } catch (error) {
        console.error('Error al crear activo:', error);
        res.status(500).json({ error: 'Error al crear activo' });
    }
};

// Actualizar activo
const actualizarActivo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, simbolo, tipoActivoId, porcentajeDividendo, frecuenciaDividendo } = req.body;
        
        const activo = await Activo.findByPk(id);
        if (!activo) {
            return res.status(404).json({ error: 'Activo no encontrado' });
        }
        
        // Verificar que el símbolo no exista en otro activo
        if (simbolo && simbolo !== activo.simbolo) {
            const simboloExistente = await Activo.findOne({ 
                where: { 
                    simbolo,
                    id: { [Op.ne]: id }
                }
            });
            if (simboloExistente) {
                return res.status(400).json({ error: 'El símbolo ya existe en otro activo' });
            }
        }
        
        await activo.update({ 
            nombre: nombre || activo.nombre,
            simbolo: simbolo || activo.simbolo,
            tipo_activo_id: tipoActivoId || activo.tipo_activo_id,
            porcentaje_dividendo: porcentajeDividendo !== undefined ? porcentajeDividendo : activo.porcentaje_dividendo,
            frecuencia_dividendo: frecuenciaDividendo || activo.frecuencia_dividendo
        });
        
        res.json({ 
            message: `Activo ${activo.nombre} actualizado correctamente`,
            activo
        });
    } catch (error) {
        console.error('Error al actualizar activo:', error);
        res.status(500).json({ error: 'Error al actualizar activo' });
    }
};

// Eliminar activo
const eliminarActivo = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        
        console.log(`Intentando eliminar activo ID: ${id}`);
        
        const activo = await Activo.findByPk(id, { transaction });
        if (!activo) {
            await transaction.rollback();
            return res.status(404).json({ error: 'Activo no encontrado' });
        }
        
        // Verificar si hay transacciones asociadas
        const transaccionesAsociadas = await Transaccion.count({
            where: { activo_id: id },
            transaction
        });
        
        if (transaccionesAsociadas > 0) {
            await transaction.rollback();
            return res.status(400).json({ 
                error: `No se puede eliminar el activo porque tiene ${transaccionesAsociadas} transacciones asociadas` 
            });
        }
        
        console.log(`Eliminando datos relacionados del activo ${activo.nombre}...`);
        
        // Eliminar historial de precios si existe
        if (HistorialPrecios) {
            await HistorialPrecios.destroy({ 
                where: { activo_id: id },
                transaction 
            });
        }
        
        // Eliminar activo
        await activo.destroy({ transaction });
        
        await transaction.commit();
        
        console.log(`Activo ${activo.nombre} eliminado correctamente`);
        
        res.json({ 
            message: `Activo ${activo.nombre} eliminado correctamente` 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error al eliminar activo:', error);
        res.status(500).json({ 
            error: 'Error al eliminar activo',
            details: error.message 
        });
    }
};

// Obtener estadísticas de activos
const obtenerEstadisticasActivos = async (req, res) => {
    try {
        console.log('=== INICIANDO OBTENER ESTADÍSTICAS ACTIVOS ===');
        
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
        
        // Calcular estadísticas usando ORM
        const [
            totalActivos,
            totalTransacciones,
            activosConDividendos,
            tiposActivos
        ] = await Promise.allSettled([
            Activo.count(),
            Transaccion ? Transaccion.count() : Promise.resolve(0),
            Activo.count({ where: { porcentaje_dividendo: { [Op.gt]: 0 } } }),
            TipoActivo ? TipoActivo.count() : Promise.resolve(0)
        ]);
        
        const estadisticas = {
            totalActivos: totalActivos.status === 'fulfilled' ? totalActivos.value : 0,
            totalTransacciones: totalTransacciones.status === 'fulfilled' ? totalTransacciones.value : 0,
            activosConDividendos: activosConDividendos.status === 'fulfilled' ? activosConDividendos.value : 0,
            tiposActivos: tiposActivos.status === 'fulfilled' ? tiposActivos.value : 0
        };
        
        estadisticas.sistemaVacio = estadisticas.totalActivos === 0;
        estadisticas.mensaje = estadisticas.totalActivos === 0 ? 'Sistema sin activos registrados' : 'Sistema activo';
        
        console.log('✅ Estadísticas de activos calculadas:', estadisticas);
        
        res.status(200).json(estadisticas);
        
    } catch (error) {
        console.log('=== ERROR EN OBTENER ESTADÍSTICAS ACTIVOS ===');
        console.error('❌ Error completo:', error);
        
        res.status(500).json({ 
            error: 'Error al obtener estadísticas de activos', 
            details: error.message
        });
    }
};

module.exports = {
    obtenerActivos,
    crearActivo,
    actualizarActivo,
    eliminarActivo,
    obtenerEstadisticasActivos
};
