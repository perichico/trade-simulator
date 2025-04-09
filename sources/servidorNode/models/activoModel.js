const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("activo", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING, allowNull: false },
        simbolo: { type: DataTypes.STRING, allowNull: false, unique: true },
        precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
    }, {
        tableName: "activos",
        timestamps: false
    });
};
