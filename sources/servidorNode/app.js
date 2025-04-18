const express = require("express");
const session = require("express-session");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");

const usuarioRoutes = require("./routes/usuarioRoutes");
const activoRoutes = require("./routes/activoRoutes");
const transaccionRoutes = require("./routes/transaccionRoutes");

const app = express();

// Configuración de CORS para Angular
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

// Configuración básica
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

// Configuración de sesión
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Rutas
app.use("/", usuarioRoutes);
app.use("/activos", activoRoutes);
app.use("/transacciones", transaccionRoutes);

// Manejo de errores globales
app.use((err, req, res, next) => {
    console.error("Error:", err.message);
    res.status(500).send("Error interno del servidor");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
