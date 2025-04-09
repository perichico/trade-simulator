const request = require("supertest");
const app = require("../app");

describe("Pruebas de API", () => {
  test("Debe obtener lista de transacciones", async () => {
    const response = await request(app).get("/transacciones");
    expect(response.status).toBe(200);
    expect(response.body).toBeInstanceOf(Array);
  });
});
