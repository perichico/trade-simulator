const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return sequelize.define("dividendo", {
    id: { 
      type: DataTypes.INTEGER, 
      autoIncrement: true, 
      primaryKey: true 
    },
    activo_id: { 
      type: DataTypes.INTEGER, 
      allowNull: false,
      references: {
        model: 'activos',
        key: 'id'
      }
    },
    fecha: { 
      type: DataTypes.DATE, 
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    monto_por_accion: { 
      type: DataTypes.DECIMAL(10, 4), 
      allowNull: false,
      comment: 'Monto en EUR que se paga por cada acción'
    },
    estado: { 
      type: DataTypes.ENUM('pendiente', 'pagado', 'cancelado'), 
      allowNull: false,
      defaultValue: 'pendiente',
      comment: 'Estado actual del dividendo'
    }
  }, {
    tableName: "dividendos",
    timestamps: false
  });
};