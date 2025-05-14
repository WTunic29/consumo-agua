require('dotenv').config();
const express = require('express');
const path = require('path');
const connectDB = require('./config/database');
const facturasRoutes = require('./routes/facturas');
const User = require('./models/User');
const Stats = require('./models/Stats');
const mongoose = require('mongoose');
const Factura = require('./models/Factura');
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const politicasRoutes = require('./routes/politicas');
const analisisRoutes = require('./routes/analisis');

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

// Rutas de autenticación
app.use('/auth', authRoutes);
// Rutas de facturas
app.use('/facturas', facturasRoutes);
// Rutas de políticas
app.use('/politicas', politicasRoutes);
// rutas de analisis
app.use('/analisis', analisisRoutes);

// Rutas
app.get('/', async (req, res) => {
    try {
        const consumos = await Stats.find({}).sort({ Mes: 1 }).lean();
        let userName = null;
        if (req.cookies && req.cookies.userName) {
            userName = req.cookies.userName;
        }
        console.log('Datos recuperados:', consumos);

        if (!consumos || consumos.length === 0) {
            console.log('No se encontraron datos de consumo');
        }

        res.render('index', { 
            title: 'Sistema de Registro de Consumo de Agua',
            consumos: consumos || [],
            userName: userName
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

// Ruta para obtener análisis de sostenibilidad
app.get('/api/sostenibilidad', async (req, res) => {
    try {
        const consumos = await Stats.find({}).sort({ fecha: -1 }).limit(2).lean();
        
        if (consumos.length < 1) {
            return res.json({ mensaje: 'No hay datos suficientes para el análisis' });
        }

        const consumoActual = consumos[0];
        const consumoAnterior = consumos[1];

        const metricas = calcularMetricasSostenibilidad(
            consumoActual.consumo,
            consumoAnterior ? consumoAnterior.consumo : null
        );

        // Generar alertas si es necesario
        const alertas = [];
        if (metricas.eficiencia_hidrica < -10) {
            alertas.push({
                tipo: 'exceso_consumo',
                mensaje: 'Se detectó un incremento significativo en el consumo',
                nivel: 'alto'
            });
        }

        // Actualizar el documento con las nuevas métricas y alertas
        await Stats.findByIdAndUpdate(consumoActual._id, {
            $set: { metricas_sostenibilidad: metricas },
            $push: { alertas: { $each: alertas } }
        });

        res.json({
            metricas,
            alertas,
            recomendaciones: [
                'Implementar sistemas de recolección de agua de lluvia',
                'Instalar dispositivos de ahorro de agua',
                'Realizar mantenimiento preventivo de tuberías'
            ]
        });
    } catch (error) {
        console.error('Error al calcular métricas de sostenibilidad:', error);
        res.status(500).json({ error: 'Error al procesar datos de sostenibilidad' });
    }
});

// Función para calcular métricas de sostenibilidad
const calcularMetricasSostenibilidad = (consumoActual, consumoAnterior, poblacion = 1000) => {
    return {
        eficiencia_hidrica: consumoAnterior ? (1 - (consumoActual / consumoAnterior)) * 100 : 0,
        consumo_per_capita: consumoActual / poblacion,
        ahorro_mensual: consumoAnterior ? ((consumoAnterior - consumoActual) / consumoAnterior) * 100 : 0,
        huella_hidrica: consumoActual * 0.5
    };
};

// Rutas para facturas
app.post('/facturas', async (req, res) => {
    try {
        const nuevaFactura = new Factura({
            usuario: req.body.usuarioId,
            numeroFactura: req.body.numeroFactura,
            fechaEmision: new Date(req.body.fechaEmision),
            fechaVencimiento: new Date(req.body.fechaVencimiento),
            periodoFacturacion: {
                inicio: new Date(req.body.periodoInicio),
                fin: new Date(req.body.periodoFin)
            },
            consumo: {
                lecturaAnterior: parseFloat(req.body.lecturaAnterior),
                lecturaActual: parseFloat(req.body.lecturaActual)
            },
            valores: {
                cargoFijo: parseFloat(req.body.cargoFijo),
                consumo: parseFloat(req.body.valorConsumo),
                otros: parseFloat(req.body.otros),
                total: parseFloat(req.body.total)
            },
            direccion: {
                calle: req.body.calle,
                ciudad: req.body.ciudad,
                codigoPostal: req.body.codigoPostal
            }
        });

        // Calcular métricas de sostenibilidad
        const facturasAnteriores = await Factura.find({
            usuario: req.body.usuarioId
        }).sort({ fechaEmision: -1 }).limit(1);

        const promedioZona = await Factura.aggregate([
            {
                $match: {
                    'direccion.ciudad': req.body.ciudad,
                    fechaEmision: {
                        $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            },
            {
                $group: {
                    _id: null,
                    promedio: { $avg: '$consumo.consumoTotal' }
                }
            }
        ]);

        const consumoActual = nuevaFactura.consumo.lecturaActual - nuevaFactura.consumo.lecturaAnterior;
        nuevaFactura.metricasSostenibilidad = {
            comparacionPromedio: promedioZona.length > 0 ? 
                ((consumoActual - promedioZona[0].promedio) / promedioZona[0].promedio) * 100 : 0,
            tendencia: facturasAnteriores.length > 0 ? 
                ((consumoActual - facturasAnteriores[0].consumo.consumoTotal) / facturasAnteriores[0].consumo.consumoTotal) * 100 : 0,
            clasificacionConsumo: consumoActual > 20 ? 'alto' : consumoActual > 10 ? 'medio' : 'bajo'
        };

        await nuevaFactura.save();

        // Actualizar estadísticas generales
        const statsUpdate = {
            zona: req.body.ciudad,
            consumo: consumoActual,
            fecha: new Date(),
            coordenadas: {
                lat: parseFloat(req.body.lat || 0),
                lng: parseFloat(req.body.lng || 0)
            }
        };
        await Stats.create(statsUpdate);

        res.status(201).json({
            mensaje: 'Factura registrada exitosamente',
            factura: nuevaFactura
        });
    } catch (error) {
        console.error('Error al registrar factura:', error);
        res.status(500).json({ error: 'Error al registrar factura' });
    }
});

// Ruta para obtener facturas de un usuario
app.get('/facturas/:usuarioId', async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.params.usuarioId })
            .sort({ fechaEmision: -1 })
            .lean();

        const analisisSostenibilidad = {
            consumoPromedio: facturas.reduce((acc, f) => acc + f.consumo.consumoTotal, 0) / facturas.length,
            tendenciaGeneral: facturas.length > 1 ? 
                ((facturas[0].consumo.consumoTotal - facturas[facturas.length-1].consumo.consumoTotal) / 
                facturas[facturas.length-1].consumo.consumoTotal) * 100 : 0,
            recomendaciones: []
        };

        // Generar recomendaciones personalizadas
        if (analisisSostenibilidad.tendenciaGeneral > 10) {
            analisisSostenibilidad.recomendaciones.push(
                'Tu consumo ha aumentado. Considera revisar posibles fugas.',
                'Implementa prácticas de ahorro de agua en tu hogar.'
            );
        }

        res.json({
            facturas,
            analisisSostenibilidad
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

// Ruta protegida para obtener perfil
app.get('/auth/perfil', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.user._id)
            .select('-password')
            .populate('facturas');
        
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Ruta para actualizar perfil
app.put('/auth/perfil', auth, async (req, res) => {
    const actualizaciones = Object.keys(req.body);
    const actualizacionesPermitidas = ['nombre', 'apellido', 'telefono', 'direccion', 'preferenciasNotificacion'];
    
    const esOperacionValida = actualizaciones.every(actualizacion => 
        actualizacionesPermitidas.includes(actualizacion)
    );

    if (!esOperacionValida) {
        return res.status(400).json({ error: 'Actualizaciones no válidas' });
    }

    try {
        actualizaciones.forEach(actualizacion => {
            if (actualizacion === 'telefono' || actualizacion === 'direccion' || actualizacion === 'preferenciasNotificacion') {
                req.user.perfil[actualizacion] = req.body[actualizacion];
            } else {
                req.user[actualizacion] = req.body[actualizacion];
            }
        });

        await req.user.save();
        res.json(req.user);
    } catch (error) {
        res.status(400).json({ error: 'Error al actualizar perfil' });
    }
});

// Proteger rutas de facturas con autenticación
app.use('/facturas', auth);

// Ruta para mostrar el formulario de registro
app.get('/auth/registro', (req, res) => {
    res.render('registro');
});

// Ruta para mostrar la página de inicio de sesión
app.get('/auth/login', (req, res) => {
    res.render('login');
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor corriendo en puerto ${port}`);
});

module.exports = app;