const { crearTransaccion } = require("../controllers/transaccionController");
const { Transaccion, Usuario, Activo } = require("../models/index");

jest.mock("../models/index");  // Esto simula el comportamiento de los modelos de Sequelize

describe("Pruebas de venta de activos", () => {
  test("Debe evitar ventas si el usuario no tiene suficientes activos", async () => {
    // Configurar el mock del request
    req.body = {
      activoId: 1,
      tipo: 'venta',
      cantidad: 100 // Intentando vender más de lo que tiene
    };
    req.session = {
      usuario: { id: 1 }
    };

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
