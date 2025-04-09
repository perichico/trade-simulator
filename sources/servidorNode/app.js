const express = require("express");
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const methodOverride = require("method-override");
const cors = require("cors");
require("dotenv").config();
const helmet = require("helmet");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

const usuarioRoutes = require("./routes/usuarioRoutes");
const activoRoutes = require("./routes/activoRoutes");
const transaccionRoutes = require("./routes/transaccionRoutes");

const app = express();

// Configuración
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(cors());
app.use(helmet());
app.use(cookieParser());

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Middleware de flash messages
app.use(flash());

// Middleware para hacer los mensajes flash accesibles en todas las vistas
app.use((req, res, next) => {
    res.locals.mensaje_exito = req.flash("exito");
    res.locals.mensaje_error = req.flash("error");
    next();
});

// Configurar CSRF después de session y cookie-parser
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// Middleware para pasar el token CSRF a todas las vistas
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken(); 
    next();
});

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
