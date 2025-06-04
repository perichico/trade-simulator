const { sequelize, Usuario, Portafolio, PortafolioActivo, Activo, Transaccion } = require('../models/index');
const { Op } = require('sequelize');

// Obtener historial de patrimonio de un usuario
exports.obtenerHistorialPatrimonio = async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { portafolioId } = req.params;

        console.log('=== OBTENER HISTORIAL PATRIMONIO ===');
        console.log('Usuario ID:', usuarioId);
        console.log('Portafolio ID:', portafolioId);

        // Verificar autenticación
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        // Verificar que el usuario coincida con la sesión
        if (req.session.usuario.id !== parseInt(usuarioId)) {
            return res.status(403).json({ error: "No autorizado para acceder a estos datos" });
        }

        // Por ahora, como no tenemos una tabla de historial, vamos a generar datos simulados
        // basados en los datos actuales del usuario y sus portafolios

        let portafolios;
        if (portafolioId) {
            // Si se especifica un portafolio, obtener solo ese
            portafolios = await Portafolio.findAll({
                where: { 
                    id: portafolioId,
                    usuario_id: usuarioId 
                }
            });
        } else {
            // Obtener todos los portafolios del usuario
            portafolios = await Portafolio.findAll({
                where: { usuario_id: usuarioId }
            });
        }

        if (portafolios.length === 0) {
            console.log('No se encontraron portafolios para el usuario');
            return res.status(200).json([]);
        }

        // Calcular el patrimonio actual
        let balanceTotal = 0;
        let valorPortafolioTotal = 0;

        for (const portafolio of portafolios) {
            balanceTotal += portafolio.saldo || 0;

            // Obtener activos del portafolio
            const activosEnPortafolio = await PortafolioActivo.findAll({
                where: { portafolio_id: portafolio.id }
            });

            for (const item of activosEnPortafolio) {
                const activo = await Activo.findByPk(item.activo_id);
                if (activo) {
                    valorPortafolioTotal += item.cantidad * (activo.ultimo_precio || 0);
                }
            }
        }

        const patrimonioActual = balanceTotal + valorPortafolioTotal;

        // Generar historial simulado para los últimos 7 días
        const historial = [];
        const hoy = new Date();

        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(hoy.getDate() - i);

            // Factor de variación que disminuye hacia el pasado
            const factorTiempo = 1 - (i * 0.02); // 2% de variación por día
            const variacionAleatoria = 0.95 + (Math.random() * 0.1); // ±5% aleatorio

            const balanceDia = balanceTotal * factorTiempo * variacionAleatoria;
            const valorPortafolioDia = valorPortafolioTotal * factorTiempo * variacionAleatoria;

            historial.push({
                usuarioId: parseInt(usuarioId),
                portafolioId: portafolioId ? parseInt(portafolioId) : null,
                fecha: fecha.toISOString().split('T')[0], // Solo la fecha
                balance: Math.round(balanceDia * 100) / 100,
                valorPortafolio: Math.round(valorPortafolioDia * 100) / 100,
                patrimonioTotal: Math.round((balanceDia + valorPortafolioDia) * 100) / 100
            });
        }

        console.log('Historial generado:', historial.length, 'registros');
        res.status(200).json(historial);

    } catch (error) {
        console.error('Error al obtener historial de patrimonio:', error);
        res.status(500).json({ 
            error: "Error al obtener historial de patrimonio",
            details: error.message 
        });
    }
};

// Obtener patrimonio actual de un usuario
exports.obtenerPatrimonioActual = async (req, res) => {
    try {
        const { usuarioId } = req.params;

        // Verificar autenticación
        if (!req.session.usuario) {
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        // Verificar que el usuario coincida con la sesión
        if (req.session.usuario.id !== parseInt(usuarioId)) {
            return res.status(403).json({ error: "No autorizado para acceder a estos datos" });
        }

        // Obtener todos los portafolios del usuario
        const portafolios = await Portafolio.findAll({
            where: { usuario_id: usuarioId }
        });

        let balanceTotal = 0;
        let valorPortafolioTotal = 0;

        for (const portafolio of portafolios) {
            balanceTotal += portafolio.saldo || 0;

            // Obtener activos del portafolio
            const activosEnPortafolio = await PortafolioActivo.findAll({
                where: { portafolio_id: portafolio.id }
            });

            for (const item of activosEnPortafolio) {
                const activo = await Activo.findByPk(item.activo_id);
                if (activo) {
                    valorPortafolioTotal += item.cantidad * (activo.ultimo_precio || 0);
                }
            }
        }

        const patrimonioActual = {
            usuarioId: parseInt(usuarioId),
            fecha: new Date().toISOString(),
            balance: balanceTotal,
            valorPortafolio: valorPortafolioTotal,
            patrimonioTotal: balanceTotal + valorPortafolioTotal
        };

        res.status(200).json(patrimonioActual);

    } catch (error) {
        console.error('Error al obtener patrimonio actual:', error);
        res.status(500).json({ 
            error: "Error al obtener patrimonio actual",
            details: error.message 
        });
    }
};
