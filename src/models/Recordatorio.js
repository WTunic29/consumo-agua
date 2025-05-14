const mongoose = require('mongoose');

const recordatorioSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: true
    },
    tipo: {
        type: String,
        enum: ['PAGO', 'CONSUMO_ELEVADO', 'PREDICCION'],
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    fecha: {
        type: Date,
        required: true
    },
    leido: {
        type: Boolean,
        default: false
    },
    datos: {
        consumoActual: Number,
        consumoPromedio: Number,
        diferencia: Number,
        prediccion: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Recordatorio', recordatorioSchema); 