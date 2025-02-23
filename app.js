const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

// Configuración
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

// Rutas
app.use('/', usuarioRoutes);

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
