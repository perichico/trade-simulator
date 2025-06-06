const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Alerta = sequelize.define('Alerta', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        usuarioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'usuario_id'
        },
        portafolioId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'portafolio_id'
        },
        activoId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'activo_id'
        },
        precioObjetivo: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            field: 'precio_objetivo'
        },
        cantidadVenta: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'cantidad_venta'
        },
        condicion: {
            type: DataTypes.ENUM('mayor', 'menor'),
            allowNull: false,
            defaultValue: 'mayor'
        },
        estado: {
            type: DataTypes.ENUM('activa', 'disparada', 'cancelada'),
            allowNull: false,
            defaultValue: 'activa'
        },
        activa: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        fechaCreacion: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'fecha_creacion'
        },
        fechaDisparo: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'fecha_disparo'
        }
    }, {
        tableName: 'alertas',
        timestamps: false
    });

    Alerta.associate = function(models) {
        Alerta.belongsTo(models.Usuario, {
            foreignKey: 'usuarioId',
            as: 'usuario'
        });
        Alerta.belongsTo(models.Portafolio, {
            foreignKey: 'portafolioId',
            as: 'portafolio'
        });
        Alerta.belongsTo(models.Activo, {
            foreignKey: 'activoId',
            as: 'activo'
        });
    };

    return Alerta;
};