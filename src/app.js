require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/database');
const pagosRoutes = require('./routes/pagos');

// Inicializar la aplicación
const app = express();

// Conectar a la base de datos
conectarDB();

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api', pagosRoutes);

// Manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 