const mongoose = require('mongoose');

const membresiaSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    plan: {
        type: String,
        enum: ['basico', 'pro', 'empresarial'],
        required: true
    },
    estado: {
        type: String,
        enum: ['activa', 'inactiva', 'vencida'],
        default: 'activa'
    },
    fechaInicio: {
        type: Date,
        default: Date.now
    },
    fechaFin: {
        type: Date,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    metodoPago: {
        type: String,
        enum: ['pse', 'tarjeta_credito', 'tarjeta_debito', 'efectivo', 'transferencia'],
        required: true
    },
    detallesPago: {
        banco: String,
        tipoCuenta: String,
        numeroCuenta: String,
        titular: String,
        documento: String,
        tipoDocumento: String,
        email: String,
        telefono: String
    },
    referenciaNu: {
        type: String,
        required: true,
        unique: true
    },
    renovacionAutomatica: {
        type: Boolean,
        default: true
    }
});

// Método para generar referencia única
membresiaSchema.statics.generarReferencia = function() {
    return 'MEM-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Método para generar token de seguridad Nu
membresiaSchema.methods.generarTokenNu = function() {
    const crypto = require('crypto');
    const apiKey = process.env.NU_API_KEY;
    const merchantId = process.env.NU_MERCHANT_ID;
    const referenceCode = this.referenciaNu;
    const amount = this.precio;
    const currency = 'COP';
    
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
};

// Método para verificar si la membresía está activa
membresiaSchema.methods.estaActiva = function() {
    return this.estado === 'activa' && new Date() < this.fechaFin;
};

// Método para renovar membresía
membresiaSchema.methods.renovar = function() {
    if (!this.renovacionAutomatica) {
        return false;
    }
    
    const nuevaFechaFin = new Date(this.fechaFin);
    nuevaFechaFin.setMonth(nuevaFechaFin.getMonth() + 1);
    
    this.fechaFin = nuevaFechaFin;
    this.estado = 'activa';
    return true;
};

module.exports = mongoose.model('Membresia', membresiaSchema); 