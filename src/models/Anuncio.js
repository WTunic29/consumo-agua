const mongoose = require('mongoose');

const anuncioSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    contenido: {
        type: String,
        required: true
    },
    imagen: {
        url: String,
        alt: String
    },
    tipo: {
        type: String,
        enum: ['general', 'promocion', 'noticia', 'evento'],
        default: 'general'
    },
    ubicacion: {
        type: String,
        enum: ['header', 'sidebar', 'content', 'footer'],
        required: true
    },
    prioridad: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    fechaInicio: {
        type: Date,
        required: true
    },
    fechaFin: {
        type: Date,
        required: true
    },
    activo: {
        type: Boolean,
        default: true
    },
    estilos: {
        backgroundColor: String,
        textColor: String,
        customClass: String
    },
    target: {
        tipo: {
            type: String,
            enum: ['todos', 'membresia', 'usuario'],
            default: 'todos'
        },
        valor: String
    },
    clicks: {
        type: Number,
        default: 0
    },
    impresiones: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Índices
anuncioSchema.index({ activo: 1, fechaInicio: 1, fechaFin: 1 });
anuncioSchema.index({ ubicacion: 1, prioridad: -1 });

// Método para verificar si el anuncio está activo
anuncioSchema.methods.estaActivo = function() {
    const ahora = new Date();
    return this.activo && 
           this.fechaInicio <= ahora && 
           this.fechaFin >= ahora;
};

// Método para registrar una impresión
anuncioSchema.methods.registrarImpresion = async function() {
    this.impresiones += 1;
    return await this.save();
};

// Método para registrar un click
anuncioSchema.methods.registrarClick = async function() {
    this.clicks += 1;
    return await this.save();
};

// Método estático para obtener anuncios activos por ubicación
anuncioSchema.statics.obtenerAnunciosActivos = async function(ubicacion, usuario = null) {
    const ahora = new Date();
    const query = {
        activo: true,
        fechaInicio: { $lte: ahora },
        fechaFin: { $gte: ahora },
        ubicacion
    };

    // Filtrar por tipo de membresía si es necesario
    if (usuario && usuario.membresia) {
        query.$or = [
            { 'target.tipo': 'todos' },
            { 
                'target.tipo': 'membresia',
                'target.valor': usuario.membresia.tipo
            }
        ];
    }

    return await this.find(query)
        .sort({ prioridad: -1, fechaInicio: -1 })
        .limit(5);
};

const Anuncio = mongoose.model('Anuncio', anuncioSchema);

module.exports = Anuncio; 