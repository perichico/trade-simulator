const sequelize = require('../database/db');
const { DataTypes } = require('sequelize');
const { Usuario } = require('./usuarioModel');
const { Activo } = require('./activoModel');

const UsuarioActivos = sequelize.define('UsuarioActivos', {
    UsuarioID: {
        type: DataTypes.INTEGER,
        references: {
            model: Usuario,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    ActivoID: {
        type: DataTypes.INTEGER,
        references: {
            model: Activo,
            key: 'ID'
        },
        onDelete: 'CASCADE'
    },
    Cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
}, {
    tableName: 'usuario_activos',
    timestamps: false
});

// Definir relaciones
Usuario.belongsToMany(Activo, { through: UsuarioActivos, foreignKey: 'UsuarioID' });
Activo.belongsToMany(Usuario, { through: UsuarioActivos, foreignKey: 'ActivoID' });

module.exports = { UsuarioActivos };