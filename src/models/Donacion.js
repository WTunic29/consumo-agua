const mongoose = require('mongoose');

const donacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
        enum: ['pendiente', 'completada', 'fallida', 'cancelada'],
        default: 'pendiente'
    },
    fecha: {
        type: Date,
        default: Date.now
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
    mensual: {
        activa: {
            type: Boolean,
            default: false
        },
        fechaProximoCargo: Date,
        renovacionAutomatica: {
            type: Boolean,
            default: true
        }
    }
});

// Método para generar referencia única
donacionSchema.statics.generarReferencia = function() {
    return 'DON-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

// Método para generar token de seguridad Nu
donacionSchema.methods.generarTokenNu = function() {
    const crypto = require('crypto');
    const apiKey = process.env.NU_API_KEY;
    const merchantId = process.env.NU_MERCHANT_ID;
    const referenceCode = this.referenciaNu;
    const amount = this.monto;
    const currency = 'COP';
    
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    return crypto.createHash('sha256').update(signatureString).digest('hex');
};

// Método para procesar renovación mensual
donacionSchema.methods.procesarRenovacionMensual = async function() {
    if (!this.mensual.activa || !this.mensual.renovacionAutomatica) {
        return false;
    }

    const hoy = new Date();
    if (hoy >= this.mensual.fechaProximoCargo) {
        // Crear nueva donación
        const nuevaDonacion = new this.constructor({
            usuario: this.usuario,
            monto: this.monto,
            tipo: 'mensual',
            metodoPago: this.metodoPago,
            detallesPago: this.detallesPago,
            mensual: {
                activa: true,
                fechaProximoCargo: new Date(hoy.setMonth(hoy.getMonth() + 1)),
                renovacionAutomatica: true
            }
        });

        nuevaDonacion.referenciaNu = this.constructor.generarReferencia();
        await nuevaDonacion.save();
        return true;
    }

    return false;
};

module.exports = mongoose.model('Donacion', donacionSchema); 