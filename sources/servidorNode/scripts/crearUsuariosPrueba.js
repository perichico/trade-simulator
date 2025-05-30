const sequelize = require('../database/db');
const Usuario = require('../models/usuarioModel');

async function consultarUsuarios() {
    try {
        console.log('🔧 Conectando a la base de datos...');
        await sequelize.authenticate();
        console.log('✅ Conexión exitosa');

        // Consultar usuarios existentes
        const usuariosExistentes = await Usuario.count();
        console.log(`📊 Total de usuarios en el sistema: ${usuariosExistentes}`);

        if (usuariosExistentes === 0) {
            console.log('ℹ️ No hay usuarios registrados en el sistema');
            return;
        }

        console.log('👥 Usuarios registrados:');
        const usuarios = await Usuario.findAll({
            attributes: ['id', 'nombre', 'email', 'rol', 'estado', 'fechaRegistro', 'createdAt']
        });
        
        console.table(usuarios.map(u => ({
            ID: u.id,
            Nombre: u.nombre,
            Email: u.email,
            Rol: u.rol,
            Estado: u.estado,
            'Fecha Registro': u.fechaRegistro || u.createdAt
        })));

        console.log(`\n📈 Resumen:`);
        console.log(`- Total usuarios: ${usuariosExistentes}`);
        
        const activos = usuarios.filter(u => u.estado === 'activo').length;
        const suspendidos = usuarios.filter(u => u.estado === 'suspendido').length;
        const admins = usuarios.filter(u => u.rol === 'admin').length;
        
        console.log(`- Usuarios activos: ${activos}`);
        console.log(`- Usuarios suspendidos: ${suspendidos}`);
        console.log(`- Administradores: ${admins}`);

    } catch (error) {
        console.error('❌ Error al consultar usuarios:', error.message);
    } finally {
        await sequelize.close();
        console.log('🔌 Conexión cerrada');
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    consultarUsuarios();
}

module.exports = consultarUsuarios;
