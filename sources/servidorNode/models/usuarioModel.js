const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("usuario", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        balance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 10000.00 },
        contrasena: { type: DataTypes.STRING, allowNull: false },
    }, {
        tableName: "usuarios",
        timestamps: false
    });
};
