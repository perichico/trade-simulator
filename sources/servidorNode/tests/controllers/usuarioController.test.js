const usuarioController = require('../../controllers/usuarioController');

// Mock de los modelos
jest.mock('../../models/index', () => ({
  Usuario: {
    findByPk: jest.fn(),
    findAll: jest.fn()
  },
  Portafolio: {
    findAll: jest.fn()
  },
  Transaccion: {
    findAll: jest.fn()
  },
  PortafolioActivo: {
    findAll: jest.fn()
  },
  Activo: {
    findByPk: jest.fn()
  },
  TipoActivo: {}
}));

// Mock del servicio de precios
jest.mock('../../services/preciosService', () => {
  return jest.fn().mockImplementation(() => ({
    obtenerPrecioActual: jest.fn().mockResolvedValue({ precio: 100 })
  }));
});

const { Usuario, Portafolio } = require('../../models/index');

describe('UsuarioController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      session: {
        usuario: { id: 1, nombre: 'Test User', estado: 'activo' }
      }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('obtenerDatosDashboard', () => {
    test('debería retornar error 401 cuando no hay sesión', async () => {
      req.session = null;
      
      await usuarioController.obtenerDatosDashboard(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Usuario no autenticado' });
    });

    test('debería retornar error 403 cuando usuario está suspendido', async () => {
      req.session.usuario.estado = 'suspendido';
      
      await usuarioController.obtenerDatosDashboard(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Usuario suspendido',
          tipo: 'USUARIO_SUSPENDIDO'
        })
      );
    });

    test('debería retornar datos del dashboard cuando hay portafolios', async () => {
      Usuario.findByPk.mockResolvedValue({
        id: 1,
        nombre: 'Test User',
        toJSON: () => ({ id: 1, nombre: 'Test User' })
      });
      
      Portafolio.findAll.mockResolvedValue([{
        id: 1,
        saldo: 10000,
        usuario_id: 1
      }]);

      // Mock para las otras consultas necesarias
      require('../../models/index').Transaccion.findAll.mockResolvedValue([]);
      require('../../models/index').PortafolioActivo.findAll.mockResolvedValue([]);
      
      await usuarioController.obtenerDatosDashboard(req, res);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          usuario: expect.any(Object),
          transacciones: expect.any(Array),
          activos: expect.any(Array)
        })
      );
    });
  });
});
