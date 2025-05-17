const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    zona: {
        type: String,
        required: true,
        enum: ['Bogotá', 'Soacha', 'Gachancipá']
    },
    consumo: {
        type: Number,
        required: true,
        min: 0
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    coordenadas: {
        lat: {
            type: Number,
            required: true,
            validate: {
                validator: function(v) {
                    return v >= -90 && v <= 90;
                },
                message: 'La latitud debe estar entre -90 y 90'
            }
        },
        lng: {
            type: Number,
            required: true,
            validate: {
                validator: function(v) {
                    return v >= -180 && v <= 180;
                },
                message: 'La longitud debe estar entre -180 y 180'
            }
        }
    },
    estadisticas: {
        tamanoAlmacenamiento: Number,
        documentos: Number,
        tamanoPromedio: Number,
        indices: Number,
        tamanoTotalIndices: Number
    },
    metricas_sostenibilidad: {
        eficiencia_hidrica: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        consumo_per_capita: {
            type: Number,
            min: 0,
            default: 0
        },
        ahorro_mensual: {
            type: Number,
            default: 0
        },
        huella_hidrica: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    alertas: [{
        tipo: {
            type: String,
            enum: ['exceso_consumo', 'fuga_potencial', 'consumo_optimo'],
            required: true
        },
        mensaje: {
            type: String,
            required: true
        },
        fecha: {
            type: Date,
            default: Date.now
        },
        nivel: {
            type: String,
            enum: ['bajo', 'medio', 'alto'],
            default: 'medio'
        }
    }]
}, {
    timestamps: true
});

// Coordenadas predefinidas para cada zona
const coordenadasZonas = {
    'Bogotá': { lat: 4.6097, lng: -74.0817 },
    'Soacha': { lat: 4.5789, lng: -74.2121 },
    'Gachancipá': { lat: 4.9925, lng: -73.8757 }
};

// Middleware para establecer coordenadas automáticamente según la zona
statsSchema.pre('save', function(next) {
    if (this.isModified('zona') && !this.isModified('coordenadas')) {
        const coords = coordenadasZonas[this.zona];
        if (coords) {
            this.coordenadas = coords;
        }
    }
    next();
});

// Método estático para inicializar datos de ejemplo
statsSchema.statics.inicializarDatos = async function() {
    const zonas = ['Bogotá', 'Soacha', 'Gachancipá'];
    const fecha = new Date();
    
    for (const zona of zonas) {
        const coords = coordenadasZonas[zona];
        await this.findOneAndUpdate(
            { zona },
            {
                zona,
                consumo: Math.floor(Math.random() * 100) + 50, // Consumo aleatorio entre 50 y 150 m³
                fecha,
                coordenadas: coords,
                metricas_sostenibilidad: {
                    eficiencia_hidrica: Math.floor(Math.random() * 100),
                    consumo_per_capita: Math.floor(Math.random() * 20) + 10,
                    ahorro_mensual: Math.floor(Math.random() * 30),
                    huella_hidrica: Math.floor(Math.random() * 50)
                }
            },
            { upsert: true, new: true }
        );
    }
};

module.exports = mongoose.model('Stats', statsSchema); 