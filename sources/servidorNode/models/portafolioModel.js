const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("portafolio", {
        id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
        nombre: { type: DataTypes.STRING, allowNull: false },
        usuario_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: "usuarios",
                key: "id"
            },
            onDelete: 'CASCADE'
        }
    }, {
        tableName: "portafolio",
        timestamps: false
    });
};