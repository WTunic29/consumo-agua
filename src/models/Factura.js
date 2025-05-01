const mongoose = require('mongoose');

const facturaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    numeroFactura: {
        type: String,
        required: true,
        unique: true
    },
    fechaEmision: {
        type: Date,
        required: true
    },
    fechaVencimiento: Date,
    periodoFacturacion: {
        inicio: Date,
        fin: Date
    },
    consumo: {
        lecturaAnterior: Number,
        lecturaActual: Number,
        consumoTotal: Number,  // en metros cúbicos
    },
    valores: {
        cargoFijo: Number,
        consumo: Number,
        otros: Number,
        total: Number
    },
    direccion: {
        calle: String,
        ciudad: String,
        codigoPostal: String
    },
    metricasSostenibilidad: {
        comparacionPromedio: Number,  // Porcentaje por encima/debajo del promedio de la zona
        tendencia: Number,           // Porcentaje de cambio respecto a la última factura
        clasificacionConsumo: String // 'bajo', 'medio', 'alto'
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagada', 'vencida'],
        default: 'pendiente'
    },
    imagenFactura: {
        type: String,  // URL o path a la imagen escaneada
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Índices para mejorar el rendimiento de las consultas
facturaSchema.index({ usuario: 1, fechaEmision: -1 });
facturaSchema.index({ numeroFactura: 1 }, { unique: true });

// Middleware para calcular métricas antes de guardar
facturaSchema.pre('save', async function(next) {
    if (this.consumo.lecturaActual && this.consumo.lecturaAnterior) {
        this.consumo.consumoTotal = this.consumo.lecturaActual - this.consumo.lecturaAnterior;
    }
    next();
});

module.exports = mongoose.model('Factura', facturaSchema); 