const sequelize = require('../database/db');

// Importar modelos
const Usuario = require('./usuarioModel');
const TipoActivo = require('./tipoActivoModel');
const Activo = require('./activoModel');
const Portafolio = require('./portafolioModel');
const PortafolioActivo = require('./portafolioActivoModel');
const HistorialPrecios = require('./historialPreciosModel');
const Dividendo = require('./dividendoModel');
const Orden = require('./ordenModel');
const Alerta = require('./alertaModel');
const Transaccion = require('./transaccionModel');

// Inicializar modelos
const UsuarioModel = Usuario(sequelize);
const TipoActivoModel = TipoActivo(sequelize);
const ActivoModel = Activo(sequelize);
const PortafolioModel = Portafolio(sequelize);
const PortafolioActivoModel = PortafolioActivo(sequelize);
const HistorialPreciosModel = HistorialPrecios(sequelize);
const DividendoModel = Dividendo(sequelize);
const OrdenModel = Orden(sequelize);
const AlertaModel = Alerta(sequelize);
const TransaccionModel = Transaccion(sequelize);

// Definir relaciones
TipoActivoModel.hasMany(ActivoModel, { foreignKey: 'tipo_activo_id', onDelete: 'RESTRICT' });
ActivoModel.belongsTo(TipoActivoModel, { foreignKey: 'tipo_activo_id', targetKey: 'id' });

UsuarioModel.hasMany(PortafolioModel, { foreignKey: 'usuario_id' });
PortafolioModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id' });

PortafolioModel.belongsToMany(ActivoModel, { through: PortafolioActivoModel, foreignKey: 'portafolio_id' });
ActivoModel.belongsToMany(PortafolioModel, { through: PortafolioActivoModel, foreignKey: 'activo_id' });

ActivoModel.hasMany(HistorialPreciosModel, { foreignKey: 'activo_id' });
HistorialPreciosModel.belongsTo(ActivoModel, { foreignKey: 'activo_id' });

ActivoModel.hasMany(DividendoModel, { foreignKey: 'activo_id' });
DividendoModel.belongsTo(ActivoModel, { foreignKey: 'activo_id' });

UsuarioModel.hasMany(OrdenModel, { foreignKey: 'usuario_id' });
OrdenModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id' });
ActivoModel.hasMany(OrdenModel, { foreignKey: 'activo_id' });
OrdenModel.belongsTo(ActivoModel, { foreignKey: 'activo_id' });

UsuarioModel.hasMany(AlertaModel, { foreignKey: 'usuario_id' });
AlertaModel.belongsTo(UsuarioModel, { foreignKey: 'usuario_id' });
ActivoModel.hasMany(AlertaModel, { foreignKey: 'activo_id' });
AlertaModel.belongsTo(ActivoModel, { foreignKey: 'activo_id' });

UsuarioModel.hasMany(TransaccionModel, { foreignKey: 'usuarioId' });
TransaccionModel.belongsTo(UsuarioModel, { foreignKey: 'usuarioId' });
ActivoModel.hasMany(TransaccionModel, { foreignKey: 'activoId' });
TransaccionModel.belongsTo(ActivoModel, { foreignKey: 'activoId' });

module.exports = {
    sequelize,
    Usuario: UsuarioModel,
    TipoActivo: TipoActivoModel,
    Activo: ActivoModel,
    Portafolio: PortafolioModel,
    PortafolioActivo: PortafolioActivoModel,
    HistorialPrecios: HistorialPreciosModel,
    Dividendo: DividendoModel,
    Orden: OrdenModel,
    Alerta: AlertaModel,
    Transaccion: TransaccionModel
};
