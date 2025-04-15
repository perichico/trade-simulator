const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("activo", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING(255), allowNull: false },
        simbolo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        tipo_activo_id: { type: DataTypes.INTEGER, allowNull: false },
        ultimo_precio: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
        ultima_actualizacion: { type: DataTypes.DATE, allowNull: true }
    }, {
        tableName: "activos",
        timestamps: false
    });
};
