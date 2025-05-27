const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("Usuario", {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(255),
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
            type: DataTypes.ENUM("usuario", "admin"),
            allowNull: false,
            defaultValue: "usuario"
        }
    }, {
        tableName: "usuarios",
        timestamps: false,
        freezeTableName: true
    });
};
