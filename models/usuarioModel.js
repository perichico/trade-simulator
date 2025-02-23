const sequelize = require('../database/db'); 
const { DataTypes } = require('sequelize');

const Usuario = sequelize.define('Usuario', {
    ID: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    Nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    Contrasena: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    Saldo: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00 // Valor inicial del saldo
    }
}, {
    tableName: 'usuarios',
    timestamps: false
});

module.exports = { Usuario };
