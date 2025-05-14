const mongoose = require('mongoose');

const configuracionSchema = new mongoose.Schema({
    tipo: {
        type: String,
        required: true,
        unique: true,
        enum: ['beneficios', 'notificaciones', 'sistema']
    },
    puntosPorPago: {
        type: Number,
        default: 10,
        min: 0,
        max: 100
    },
    descuentoRacha3: {
        type: Number,
        default: 5,
        min: 0,
        max: 100
    },
    notificaciones: {
        recordatorioPago: {
            diasAntes: {
                type: Number,
                default: 3
            },
            activo: {
                type: Boolean,
                default: true
            }
        },
        logros: {
            activo: {
                type: Boolean,
                default: true
            }
        },
        beneficios: {
            activo: {
                type: Boolean,
                default: true
            }
        }
    },
    sistema: {
        moneda: {
            type: String,
            default: 'COP'
        },
        zonaHoraria: {
            type: String,
            default: 'America/Bogota'
        },
        diasGracia: {
            type: Number,
            default: 3
        },
        porcentajeMora: {
            type: Number,
            default: 2
        }
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    }
});

// Middleware para actualizar fechaActualizacion
configuracionSchema.pre('save', function(next) {
    this.fechaActualizacion = Date.now();
    next();
});

// Método estático para obtener configuración
configuracionSchema.statics.obtenerConfiguracion = async function(tipo) {
    const config = await this.findOne({ tipo });
    if (!config) {
        throw new Error(`Configuración de tipo ${tipo} no encontrada`);
    }
    return config;
};

// Método para actualizar configuración
configuracionSchema.methods.actualizar = async function(datos) {
    Object.assign(this, datos);
    return await this.save();
};

const Configuracion = mongoose.model('Configuracion', configuracionSchema);

module.exports = Configuracion; 