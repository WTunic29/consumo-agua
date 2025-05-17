const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    apellido: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    verificado: {
        type: Boolean,
        default: false
    },
    tokenVerificacion: String,
    tokenExpiracion: Date,
    perfil: {
        telefono: String,
        direccion: {
            calle: String,
            ciudad: String,
            codigoPostal: String
        },
        preferenciasNotificacion: {
            email: {
                type: Boolean,
                default: true
            },
            web: {
                type: Boolean,
                default: true
            },
            push: {
                type: Boolean,
                default: true
            }
        }
    },
    role: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
    },
    membresia: {
        plan: {
            type: String,
            enum: ['gratuito', 'basico', 'pro', 'empresarial'],
            default: 'gratuito'
        },
        fechaInicio: {
            type: Date,
            default: Date.now
        },
        fechaFin: Date,
        estado: {
            type: String,
            enum: ['activa', 'inactiva', 'vencida'],
            default: 'activa'
        },
        beneficios: [{
            tipo: String,
            descripcion: String,
            activo: {
                type: Boolean,
                default: true
            }
        }]
    },
    facturas: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Factura'
    }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: Date,
    politicasAceptadas: {
        aceptadas: {
            type: Boolean,
            default: false
        },
        fechaAceptacion: {
            type: Date
        },
        versionPoliticas: {
            type: String,
            default: '1.0'
        }
    },
    fechaCreacion: {
        type: Date,
        default: Date.now
    }
});

// Middleware para hashear la contraseña antes de guardar
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Método para generar token de restablecimiento de contraseña
userSchema.methods.generatePasswordReset = function() {
    this.resetPasswordToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordExpires = Date.now() + 3600000; // 1 hora
};

// Método para actualizar la membresía
userSchema.methods.actualizarMembresia = async function(tipo, duracionMeses = 1) {
    const fechaInicio = new Date();
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + duracionMeses);

    this.membresia = {
        tipo,
        fechaInicio,
        fechaFin,
        estado: 'activa',
        beneficios: this.obtenerBeneficiosPorTipo(tipo)
    };

    await this.save();
};

// Método para obtener beneficios según el tipo de membresía
userSchema.methods.obtenerBeneficiosPorTipo = function(tipo) {
    const beneficios = {
        gratuita: [
            { tipo: 'basico', descripcion: 'Acceso a facturas básicas' }
        ],
        basica: [
            { tipo: 'basico', descripcion: 'Acceso a facturas básicas' },
            { tipo: 'estadisticas', descripcion: 'Estadísticas de consumo' },
            { tipo: 'notificaciones', descripcion: 'Notificaciones personalizadas' }
        ],
        premium: [
            { tipo: 'basico', descripcion: 'Acceso a facturas básicas' },
            { tipo: 'estadisticas', descripcion: 'Estadísticas de consumo' },
            { tipo: 'notificaciones', descripcion: 'Notificaciones personalizadas' },
            { tipo: 'soporte', descripcion: 'Soporte prioritario' },
            { tipo: 'reportes', descripcion: 'Reportes avanzados' }
        ]
    };

    return beneficios[tipo] || beneficios.gratuita;
};

module.exports = mongoose.model('User', userSchema);