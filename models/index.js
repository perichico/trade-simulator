const { Usuario } = require('./usuarioModel');
const { TipoActivo } = require('./tipoActivoModel');
const { Activo } = require('./activoModel');
const { Transaccion } = require('./transaccionModel');


// Un usuario tiene muchas transacciones
Usuario.hasMany(Transaccion, { foreignKey: 'UsuarioID' });
Transaccion.belongsTo(Usuario, { foreignKey: 'UsuarioID' });

// Un usuario puede tener muchos activos (muchos a muchos)
Usuario.belongsToMany(Activo, { 
    through: 'UsuarioActivos', 
    foreignKey: 'UsuarioID' 
});

Activo.belongsToMany(Usuario, { 
    through: 'UsuarioActivos', 
    foreignKey: 'ActivoID' 
});

module.exports = { Usuario, TipoActivo, Activo, Transaccion };
