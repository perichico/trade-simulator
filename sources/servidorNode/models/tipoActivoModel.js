const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('TipoActivo', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true
        }
    }, {
        tableName: 'tipos_activos',
        timestamps: false
    });
};
