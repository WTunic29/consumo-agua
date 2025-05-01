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
            }
        }
    },
    role: {
        type: String,
        enum: ['usuario', 'admin'],
        default: 'usuario'
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
    lastLogin: Date
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

module.exports = mongoose.model('User', userSchema);