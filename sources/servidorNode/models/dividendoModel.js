const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("dividendo", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        activo_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "activos",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        fecha_pago: { type: DataTypes.DATE, allowNull: false }
    }, {
        tableName: "dividendos",
        timestamps: false
    });
};