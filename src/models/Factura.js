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
        required: false,
        default: 0
    },
    tipo: {
        type: String,
        enum: ['unica', 'mensual'],
        default: 'mensual'
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
        lecturaAnterior: {
            type: Number,
            required: true
        },
        lecturaActual: {
            type: Number,
            required: true
        },
        consumoTotal: {
            type: Number,
            default: 0
        }
    },
    valores: {
        cargoFijo: {
            type: Number,
            default: 0
        },
        consumo: {
            type: Number,
            default: 0
        },
        otros: {
            type: Number,
            default: 0
        },
        total: {
            type: Number,
            default: 0
        }
    },
    direccion: {
        calle: String,
        ciudad: String,
        codigoPostal: String
    },
    metricasSostenibilidad: {
        comparacionPromedio: Number,
        tendencia: Number,
        clasificacionConsumo: {
            type: String,
            enum: ['bajo', 'medio', 'alto'],
            default: 'medio'
        }
    },
    estado: {
        type: String,
        enum: ['pendiente', 'pagada', 'vencida'],
        default: 'pendiente'
    },
    imagenFactura: String,
    referenciaPayU: String,
    datosPago: {
        nombre: String,
        email: String,
        telefono: String,
        direccion: String
    }
}, {
    timestamps: true
});

// Índices
facturaSchema.index({ usuario: 1, fechaEmision: -1 });
facturaSchema.index({ numeroFactura: 1 }, { unique: true });

// Middleware para calcular valores antes de guardar
facturaSchema.pre('save', async function(next) {
    try {
        // Calcular consumo total
        if (this.consumo.lecturaActual && this.consumo.lecturaAnterior) {
            this.consumo.consumoTotal = this.consumo.lecturaActual - this.consumo.lecturaAnterior;
        }

        // Calcular total
        if (this.valores) {
            this.valores.total = (this.valores.cargoFijo || 0) + 
                               (this.valores.consumo || 0) + 
                               (this.valores.otros || 0);
            this.monto = this.valores.total; // Actualizar monto con el total
        }

        // Calcular métricas de sostenibilidad
        if (this.consumo.consumoTotal) {
            // Aquí podrías agregar la lógica para calcular las métricas
            // Por ahora solo establecemos valores por defecto
            this.metricasSostenibilidad = {
                comparacionPromedio: 0,
                tendencia: 0,
                clasificacionConsumo: 'medio'
            };
        }

        next();
    } catch (error) {
        next(error);
    }
});

// Método para crear factura
facturaSchema.statics.crearFactura = async function(datosFactura) {
    try {
        const factura = new this(datosFactura);
        await factura.save();
        return factura;
    } catch (error) {
        console.error('Error al crear factura:', error);
        throw new Error(`Error al crear la factura: ${error.message}`);
    }
};

// Método para actualizar estado
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
        console.error('Error al actualizar estado:', error);
        throw new Error(`Error al actualizar la factura: ${error.message}`);
    }
};

// Método para obtener facturas de usuario
facturaSchema.statics.obtenerFacturasUsuario = async function(idUsuario) {
    try {
        return await this.find({ usuario: idUsuario })
            .sort({ fechaEmision: -1 });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        throw new Error(`Error al obtener las facturas: ${error.message}`);
    }
};

// Método para obtener una factura
facturaSchema.statics.obtenerFactura = async function(idFactura) {
    try {
        const factura = await this.findById(idFactura);
        if (!factura) {
            throw new Error('Factura no encontrada');
        }
        return factura;
    } catch (error) {
        console.error('Error al obtener factura:', error);
        throw new Error(`Error al obtener la factura: ${error.message}`);
    }
};

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura; 