const sequelize = require('../database/db'); 
const { DataTypes } = require('sequelize');

const TipoActivo = sequelize.define('TipoActivo', {
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
    tableName: 'tipos_activos',
    timestamps: false
});

module.exports = { TipoActivo };
