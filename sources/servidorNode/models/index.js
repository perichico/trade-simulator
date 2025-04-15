const sequelize = require('../database/db');

// Importar modelos
const Usuario = require('./usuarioModel')(sequelize);
const Activo = require('./activoModel')(sequelize);
const Transaccion = require('./transaccionModel')(sequelize);

// Definir relaciones
Usuario.hasMany(Transaccion, { foreignKey: 'usuarioId' });
Transaccion.belongsTo(Usuario, { foreignKey: 'usuarioId' });

Activo.hasMany(Transaccion, { foreignKey: 'activoId' });
Transaccion.belongsTo(Activo, { foreignKey: 'activoId' });

module.exports = { sequelize, Usuario, Activo, Transaccion };
