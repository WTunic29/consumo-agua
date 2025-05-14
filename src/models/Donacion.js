const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    monto: {
        type: Number,
        required: true,
        min: 1000 // Monto mínimo de 1.000 COP
    },
    tipo: {
        type: String,
        enum: ['unica', 'mensual'],
        required: true
    },
    estado: {
        type: String,
        enum: ['pendiente', 'completada', 'fallida', 'reembolsada'],
        default: 'pendiente'
    },
    referenciaPayU: {
        type: String,
        required: true,
        unique: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaPago: Date,
    metodoPago: String,
    detallesPago: {
        tipo: String,
        banco: String,
        numeroTarjeta: String,
        cuotas: Number
    },
    comprobante: {
        url: String,
        nombre: String
    }
});

// Método para generar referencia única
donacionSchema.statics.generarReferencia = function() {
    return 'DON-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Método para calcular la firma de PayU
donacionSchema.methods.calcularFirmaPayU = function() {
    const crypto = require('crypto');
    const apiKey = process.env.PAYU_API_KEY;
    const merchantId = process.env.PAYU_MERCHANT_ID;
    const referenceCode = this.referenciaPayU;
    const amount = this.monto;
    const currency = 'COP';
    
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
};

module.exports = mongoose.model('Donacion', donacionSchema); 