const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Activo = require('./activo');

const TipoActivo = sequelize.define('tipo_activo', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'tipos_activos',
    timestamps: false
});

// Establecer la relación con Activo
TipoActivo.hasMany(Activo, { foreignKey: 'tipo_activo_id' });
Activo.belongsTo(TipoActivo, { foreignKey: 'tipo_activo_id' });

// Sincronizar el modelo con la base de datos
TipoActivo.sync({ alter: true, force: false })
    .then(() => console.log('Modelo TipoActivo sincronizado'))
    .catch(error => console.error('Error al sincronizar modelo TipoActivo:', error));

module.exports = TipoActivo;