const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Dividendo = sequelize.define('dividendo', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    activo_id: {
      type: DataTypes.INTEGER,
      allowNull: false
      // Eliminamos la referencia para evitar que Sequelize intente crear la clave foránea
    },
    fecha: {
      type: DataTypes.DATEONLY,  // Cambiado a DATEONLY para evitar problemas con fechas
      allowNull: false
    },
    monto_por_accion: {
      type: DataTypes.DECIMAL(15, 6),
      allowNull: false
    },
    estado: {
      type: DataTypes.STRING,  // Cambiado a STRING para evitar problemas con ENUM
      defaultValue: 'pendiente',
      validate: {
        isIn: [['pendiente', 'pagado', 'cancelado']]
      }
    }
  }, {
    tableName: 'dividendo',
    timestamps: false,  // Desactivar timestamps automáticos para mayor compatibilidad
    indexes: [
      { fields: ['activo_id'] }
    ]
  });

  // Definir las asociaciones manualmente después de que todas las tablas estén creadas
  Dividendo.associate = function(models) {
    Dividendo.belongsTo(models.Activo, {
      foreignKey: 'activo_id',
      constraints: false // Importante: no crear restricciones de clave foránea
    });
  };

  return Dividendo;
};