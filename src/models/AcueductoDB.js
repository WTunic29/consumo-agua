const mongoose = require('mongoose');

const acueductoDBSchema = new mongoose.Schema({
    sector: {
        type: String,
        required: true,
        index: true
    },
    coordenadas: {
        lat: {
            type: Number,
            required: true
        },
        lng: {
            type: Number,
            required: true
        }
    },
    consumo: {
        actual: {
            type: Number,
            required: true
        },
        historico: [{
            fecha: Date,
            valor: Number
        }]
    },
    metricas: {
        eficiencia: Number,
        perdidas: Number,
        presion: Number,
        calidad: {
            ph: Number,
            turbidez: Number,
            cloro: Number
        }
    },
    infraestructura: {
        tipo: String,
        estado: String,
        ultimaMantenimiento: Date,
        proximoMantenimiento: Date
    },
    alertas: [{
        tipo: String,
        mensaje: String,
        fecha: Date,
        nivel: {
            type: String,
            enum: ['bajo', 'medio', 'alto']
        },
        resuelto: {
            type: Boolean,
            default: false
        }
    }]
}, {
    timestamps: true
});

// Índices para búsquedas eficientes
acueductoDBSchema.index({ 'coordenadas.lat': 1, 'coordenadas.lng': 1 });
acueductoDBSchema.index({ 'consumo.actual': 1 });
acueductoDBSchema.index({ 'alertas.nivel': 1, 'alertas.resuelto': 1 });

module.exports = mongoose.model('AcueductoDB', acueductoDBSchema); 