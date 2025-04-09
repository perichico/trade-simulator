const { crearTransaccion } = require("../controllers/transaccionController");
const { Transaccion, Usuario, Activo } = require("../models/index");

jest.mock("../models/index");  // Esto simula el comportamiento de los modelos de Sequelize

describe("Pruebas de venta de activos", () => {
  test("Debe evitar ventas si el usuario no tiene suficientes activos", async () => {
    const req = {
      session: { usuario: { id: 1 } }, // Usuario con ID 1
      body: { activoId: 1, tipo: "venta", cantidad: 100 }, // Intento de vender 100 activos
    };

    const res = {
      status: jest.fn().mockReturnThis(), 
      json: jest.fn(),
    };

    // Mock de la base de datos
    Activo.findByPk.mockResolvedValue({ id: 1, nombre: "Activo A", precio: 10 });
    Transaccion.findAll.mockResolvedValue([   // Simulamos que el usuario tiene 50 activos
      { tipo: "compra", cantidad: 50 },
    ]);

    await crearTransaccion(req, res);

    // Comprobamos que la respuesta tenga el estado 400
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "No tienes suficientes activos para vender",
    });
  });
});
