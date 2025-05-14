const mongoose = require('mongoose');

const beneficioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true
    },
    tipo: {
        type: String,
        enum: ['descuento', 'puntos', 'servicio', 'otro'],
        required: true
    },
    valor: {
        type: Number,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaActualizacion: {
        type: Date,
        default: Date.now
    },
    condiciones: {
        membresiaMinima: {
            type: String,
            enum: ['basica', 'premium', 'vip'],
            default: 'basica'
        },
        puntosRequeridos: {
            type: Number,
            default: 0
        },
        rachaPagosRequerida: {
            type: Number,
            default: 0
        }
    },
    duracion: {
        tipo: {
            type: String,
            enum: ['unica', 'temporal', 'permanente'],
            default: 'unica'
        },
        dias: {
            type: Number,
            default: 0
        }
    }
});

// Middleware para actualizar fechaActualizacion
beneficioSchema.pre('save', function(next) {
    this.fechaActualizacion = Date.now();
    next();
});

// Método para verificar si un usuario cumple con las condiciones
beneficioSchema.methods.verificarElegibilidad = function(usuario) {
    const { membresia, puntos, rachaPagos } = usuario;
    
    // Verificar membresía mínima
    const nivelesMembresia = ['basica', 'premium', 'vip'];
    const nivelUsuario = nivelesMembresia.indexOf(membresia);
    const nivelRequerido = nivelesMembresia.indexOf(this.condiciones.membresiaMinima);
    
    if (nivelUsuario < nivelRequerido) {
        return false;
    }

    // Verificar puntos requeridos
    if (puntos < this.condiciones.puntosRequeridos) {
        return false;
    }

    // Verificar racha de pagos
    if (rachaPagos < this.condiciones.rachaPagosRequerida) {
        return false;
    }

    return true;
};

// Método para aplicar el beneficio
beneficioSchema.methods.aplicar = function(usuario, factura) {
    if (!this.verificarElegibilidad(usuario)) {
        throw new Error('Usuario no cumple con los requisitos para este beneficio');
    }

    switch (this.tipo) {
        case 'descuento':
            const descuento = (factura.monto * this.valor) / 100;
            factura.monto -= descuento;
            factura.beneficios.descuentoAplicado = descuento;
            break;
            
        case 'puntos':
            const puntos = Math.floor(factura.monto * (this.valor / 100));
            usuario.puntos += puntos;
            factura.beneficios.puntosGanados = puntos;
            break;
            
        case 'servicio':
            // Implementar lógica específica para beneficios de servicio
            break;
            
        default:
            throw new Error('Tipo de beneficio no soportado');
    }

    return {
        beneficio: this,
        usuario,
        factura
    };
};

const Beneficio = mongoose.model('Beneficio', beneficioSchema);

module.exports = Beneficio; 