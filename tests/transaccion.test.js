const { Usuario } = require("../models/index");
const { crearTransaccion } = require("../controllers/transaccionController");

describe("Pruebas de compra de activos", () => {
  test("No debe permitir compras si el saldo es insuficiente", async () => {
    // Simular usuario con saldo bajo
    const usuario = await Usuario.create({ nombre: "Prueba", balance: 50 });

    const req = {
      session: { usuario: usuario },
      body: { activoId: 1, tipo: "compra", cantidad: 1000 },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await crearTransaccion(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Saldo insuficiente" });
  });
});
