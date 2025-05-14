const mongoose = require('mongoose');

const notificacionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tipo: {
        type: String,
        enum: ['recordatorio', 'beneficio', 'logro', 'sistema'],
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    mensaje: {
        type: String,
        required: true
    },
    leida: {
        type: Boolean,
        default: false
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    },
    fechaVencimiento: Date,
    datosAdicionales: {
        facturaId: mongoose.Schema.Types.ObjectId,
        beneficioId: String,
        puntos: Number,
        nivelMembresia: String
    },
    accion: {
        tipo: String,
        url: String,
        texto: String
    }
}, {
    timestamps: true
});

// Índices
notificacionSchema.index({ usuario: 1, fechaCreacion: -1 });
notificacionSchema.index({ tipo: 1, fechaVencimiento: 1 });

// Método para crear notificación
notificacionSchema.statics.crearNotificacion = async function(datos) {
    try {
        const notificacion = new this(datos);
        await notificacion.save();
        return notificacion;
    } catch (error) {
        console.error('Error al crear notificación:', error);
        throw error;
    }
};

// Método para obtener notificaciones no leídas
notificacionSchema.statics.obtenerNoLeidas = async function(usuarioId) {
    try {
        return await this.find({
            usuario: usuarioId,
            leida: false
        }).sort({ fechaCreacion: -1 });
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        throw error;
    }
};

// Método para marcar como leída
notificacionSchema.methods.marcarComoLeida = async function() {
    this.leida = true;
    return await this.save();
};

const Notificacion = mongoose.model('Notificacion', notificacionSchema);

module.exports = Notificacion; 