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
    fechaVencimiento: {
        type: Date,
        required: true
    },
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
        enum: ['pendiente', 'pagada', 'vencida', 'mora'],
        default: 'pendiente'
    },
    diasMora: {
        type: Number,
        default: 0
    },
    imagenFactura: String,
    referenciaPayU: String,
    datosPago: {
        nombre: String,
        email: String,
        telefono: String,
        direccion: String
    },
    beneficios: {
        puntosGanados: {
            type: Number,
            default: 0
        },
        descuentoAplicado: {
            type: Number,
            default: 0
        },
        rachaPagos: {
            type: Number,
            default: 0
        }
    },
    membresia: {
        tipo: {
            type: String,
            enum: ['basica', 'premium', 'vip'],
            default: 'basica'
        },
        fechaInicio: Date,
        fechaFin: Date,
        beneficios: [{
            tipo: String,
            descripcion: String,
            activo: Boolean
        }]
    }
}, {
    timestamps: true
});

// Índices
facturaSchema.index({ usuario: 1, fechaEmision: -1 });
facturaSchema.index({ numeroFactura: 1 }, { unique: true });
facturaSchema.index({ estado: 1, fechaVencimiento: 1 });

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
            this.monto = this.valores.total;
        }

        // Calcular métricas de sostenibilidad
        if (this.consumo.consumoTotal) {
            this.metricasSostenibilidad = {
                comparacionPromedio: 0,
                tendencia: 0,
                clasificacionConsumo: 'medio'
            };
        }

        // Actualizar estado y días de mora
        if (this.estado !== 'pagada') {
            const hoy = new Date();
            if (this.fechaVencimiento && hoy > this.fechaVencimiento) {
                const diasDiferencia = Math.floor((hoy - this.fechaVencimiento) / (1000 * 60 * 60 * 24));
                this.diasMora = diasDiferencia;
                this.estado = diasDiferencia > 30 ? 'mora' : 'vencida';
            }
        }

    next();
    } catch (error) {
        next(error);
    }
});

// Método estático para actualizar estados de facturas vencidas
facturaSchema.statics.actualizarEstadosVencidos = async function() {
    try {
        const hoy = new Date();
        const facturasVencidas = await this.find({
            estado: { $in: ['pendiente', 'vencida'] },
            fechaVencimiento: { $lt: hoy }
        });

        for (const factura of facturasVencidas) {
            const diasDiferencia = Math.floor((hoy - factura.fechaVencimiento) / (1000 * 60 * 60 * 24));
            factura.diasMora = diasDiferencia;
            factura.estado = diasDiferencia > 30 ? 'mora' : 'vencida';
            await factura.save();
        }

        return facturasVencidas.length;
    } catch (error) {
        console.error('Error al actualizar estados vencidos:', error);
        throw error;
    }
};

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

// Método para calcular beneficios por pago puntual
facturaSchema.methods.calcularBeneficios = async function() {
    try {
        const hoy = new Date();
        const esPagoPuntual = hoy <= this.fechaVencimiento;
        
        if (esPagoPuntual) {
            // Calcular puntos base
            this.beneficios.puntosGanados = Math.floor(this.monto * 0.1); // 10% del monto en puntos
            
            // Incrementar racha de pagos
            this.beneficios.rachaPagos += 1;
            
            // Aplicar descuento por racha
            if (this.beneficios.rachaPagos >= 3) {
                this.beneficios.descuentoAplicado = 0.05; // 5% de descuento por 3 pagos puntuales
            }
            
            // Actualizar membresía según racha
            if (this.beneficios.rachaPagos >= 6) {
                this.membresia.tipo = 'premium';
                this.membresia.beneficios = [
                    { tipo: 'descuento', descripcion: '10% de descuento en todas las facturas', activo: true },
                    { tipo: 'prioridad', descripcion: 'Atención prioritaria', activo: true }
                ];
            }
            
            if (this.beneficios.rachaPagos >= 12) {
                this.membresia.tipo = 'vip';
                this.membresia.beneficios = [
                    { tipo: 'descuento', descripcion: '15% de descuento en todas las facturas', activo: true },
                    { tipo: 'prioridad', descripcion: 'Atención VIP', activo: true },
                    { tipo: 'extras', descripcion: 'Servicios adicionales gratuitos', activo: true }
                ];
            }
        }
        
        return this;
    } catch (error) {
        console.error('Error al calcular beneficios:', error);
        throw error;
    }
};

// Método para obtener resumen de beneficios
facturaSchema.methods.obtenerResumenBeneficios = function() {
    return {
        puntosGanados: this.beneficios.puntosGanados,
        descuentoAplicado: this.beneficios.descuentoAplicado,
        rachaPagos: this.beneficios.rachaPagos,
        membresia: {
            tipo: this.membresia.tipo,
            beneficios: this.membresia.beneficios
        }
    };
};

const Factura = mongoose.model('Factura', facturaSchema);

module.exports = Factura; 