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
    monto: {
        type: Number,
        required: true
    },
    tipo: {
        type: String,
        enum: ['unica', 'mensual'],
        required: true
    },
    fechaEmision: {
        type: Date,
        default: Date.now
    },
    fechaVencimiento: Date,
    fechaPago: Date,
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
    referenciaPayU: {
        type: String
    },
    datosPago: {
        nombre: String,
        email: String,
        telefono: String,
        direccion: String
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

// Método para guardar una nueva factura
facturaSchema.statics.crearFactura = async function(datosFactura) {
    try {
        const factura = new this(datosFactura);
        await factura.save();
        return factura;
    } catch (error) {
        throw new Error(`Error al crear la factura: ${error.message}`);
    }
};

// Método para actualizar el estado de una factura
facturaSchema.statics.actualizarEstado = async function(idFactura, nuevoEstado, datosAdicionales = {}) {
    try {
        const actualizacion = {
            estado: nuevoEstado,
            ...datosAdicionales
        };
        
        if (nuevoEstado === 'pagada') {
            actualizacion.fechaPago = new Date();
        }

        const factura = await this.findByIdAndUpdate(
            idFactura,
            actualizacion,
            { new: true }
        );

        if (!factura) {
            throw new Error('Factura no encontrada');
        }

        return factura;
    } catch (error) {
        throw new Error(`Error al actualizar la factura: ${error.message}`);
    }
};

// Método para obtener las facturas de un usuario
facturaSchema.statics.obtenerFacturasUsuario = async function(idUsuario) {
    try {
        return await this.find({ usuario: idUsuario })
            .sort({ fechaCreacion: -1 });
    } catch (error) {
        throw new Error(`Error al obtener las facturas: ${error.message}`);
    }
};

// Método para obtener una factura específica
facturaSchema.statics.obtenerFactura = async function(idFactura) {
    try {
        const factura = await this.findById(idFactura);
        if (!factura) {
            throw new Error('Factura no encontrada');
        }
        return factura;
    } catch (error) {
        throw new Error(`Error al obtener la factura: ${error.message}`);
    }
};

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura; 