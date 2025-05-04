const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    return sequelize.define("transaccion", {
        id: { 
            type: DataTypes.INTEGER, 
            autoIncrement: true, 
            primaryKey: true 
        },
        usuario_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            references: {
                model: "usuarios", // El nombre de la tabla de usuarios
                key: "id" // La columna que hace referencia en la tabla usuarios
            },
            onDelete: 'CASCADE' // Si un usuario se elimina, las transacciones asociadas también se eliminan
        },
        activo_id: { 
            type: DataTypes.INTEGER, 
            allowNull: false, 
            references: {
                model: "activos", // El nombre de la tabla de activos
                key: "id" // La columna que hace referencia en la tabla activos
            },
            onDelete: 'CASCADE' // Si un activo se elimina, las transacciones asociadas también se eliminan
        },
        cantidad: { 
            type: DataTypes.INTEGER, 
            allowNull: false 
        },
        precio: { 
            type: DataTypes.DECIMAL(10, 2), 
            allowNull: false
        },
        fecha: { 
            type: DataTypes.DATE, 
            allowNull: false // Nueva columna para la fecha de la transacción
        },
        tipo: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                isIn: [['compra', 'venta']]
            }
        }
    }, {
        tableName: "transacciones", // Nombre de la tabla
        timestamps: false // No se utilizan createdAt y updatedAt en este modelo
    });
};
