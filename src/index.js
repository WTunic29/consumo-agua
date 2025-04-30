require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const User = require('./models/User');
const Stats = require('./models/Stats');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Conectar a MongoDB
connectDB();

// Configuración
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', async (req, res) => {
    try {
        const consumos = await Stats.find({}).sort({ Mes: 1 }).lean();
        console.log('Datos recuperados:', consumos); // Log para depuración

        if (!consumos || consumos.length === 0) {
            console.log('No se encontraron datos de consumo');
        }

        res.render('index', { 
            title: 'Sistema de Registro de Consumo de Agua',
            consumos: consumos || []
        });
    } catch (error) {
        console.error('Error al obtener datos:', error);
        res.status(500).send('Error del servidor');
    }
});

// Ruta API para consultar datos
app.get('/api/datos', async (req, res) => {
    try {
        const consumos = await Stats.find({}).sort({ Mes: 1 }).lean();
        res.json({
            consumos: consumos || []
        });
    } catch (error) {
        console.error('Error al obtener datos:', error);
        res.status(500).json({ error: 'Error al obtener datos' });
    }
});

// Ruta para registrar nuevo consumo
app.post('/consumo', async (req, res) => {
    try {
        const nuevoConsumo = new Stats({
            zona: req.body.zona,
            consumo: parseFloat(req.body.consumo),
            fecha: new Date(),
            coordenadas: {
                lat: parseFloat(req.body.lat),
                lng: parseFloat(req.body.lng)
            },
            estadisticas: {
                tamanoAlmacenamiento: parseFloat(req.body.tamanoAlmacenamiento),
                documentos: parseInt(req.body.documentos),
                tamanoPromedio: parseFloat(req.body.tamanoPromedio),
                indices: parseInt(req.body.indices),
                tamanoTotalIndices: parseFloat(req.body.tamanoTotalIndices)
            }
        });
        await nuevoConsumo.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al registrar consumo');
    }
});

// Ruta para crear usuario (POST)
app.post('/usuarios', async (req, res) => {
    try {
        const nuevoUsuario = new User({
            nombre: req.body.nombre,
            email: req.body.email
        });
        await nuevoUsuario.save();
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al crear usuario');
    }
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});