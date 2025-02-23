const sequelize = require('../database/db'); 
const { DataTypes } = require('sequelize');
const { TipoActivo } = require('./tipoActivoModel'); 

const Activo = sequelize.define('Activo', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: 'activos',
    timestamps: false
});

// Relación con TipoActivo
Activo.belongsTo(TipoActivo, { foreignKey: 'TipoActivoID', onDelete: 'CASCADE' });
TipoActivo.hasMany(Activo, { foreignKey: 'TipoActivoID', onDelete: 'CASCADE' });

module.exports = { Activo };
