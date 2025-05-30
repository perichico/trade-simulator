const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("usuario", {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        nombre: { 
            type: DataTypes.STRING(100), 
            allowNull: false 
        },
        email: { 
            type: DataTypes.STRING(255), 
            allowNull: false, 
            unique: true 
        },
        contrasena: { 
            type: DataTypes.STRING(255), 
            allowNull: false 
        },
        rol: {
            type: DataTypes.ENUM('usuario', 'admin'),
            allowNull: false,
            defaultValue: 'usuario'
        },
        estado: {
            type: DataTypes.ENUM('activo', 'suspendido'),
            allowNull: false,
            defaultValue: 'activo'
        },
        fechaRegistro: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        fechaActualizacion: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: "usuarios",
        timestamps: false // Usar nuestros propios campos de fecha
    });
};
