const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Función para enviar correo de verificación
async function enviarCorreoVerificacion(email, token) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verifica tu cuenta - Sistema de Consumo de Agua',
        html: `
            <h1>Bienvenido al Sistema de Consumo de Agua</h1>
            <p>Por favor, verifica tu cuenta haciendo clic en el siguiente enlace:</p>
            <a href="${process.env.BASE_URL}/auth/verificar/${token}">Verificar cuenta</a>
            <p>Este enlace expirará en 24 horas.</p>
        `
    };

    await transporter.sendMail(mailOptions);
}

// Ruta de registro
router.post('/registro', async (req, res) => {
    try {
        const { email, password, nombre, apellido, telefono, direccion } = req.body;

        // Verificar si el usuario ya existe
        let usuario = await User.findOne({ email });
        if (usuario) {
            return res.status(400).json({ error: 'El usuario ya existe' });
        }

        // Generar token de verificación
        const tokenVerificacion = crypto.randomBytes(32).toString('hex');
        const tokenExpiracion = Date.now() + 24 * 60 * 60 * 1000; // 24 horas

        // Crear nuevo usuario
        usuario = new User({
            email,
            password,
            nombre,
            apellido,
            telefono,
            direccion,
            verificado: false,
            tokenVerificacion,
            tokenExpiracion
        });

        // Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        usuario.password = await bcrypt.hash(password, salt);

        await usuario.save();

        // Enviar correo de verificación
        try {
            await enviarCorreoVerificacion(email, tokenVerificacion);
            res.status(201).json({
                mensaje: 'Usuario registrado exitosamente. Por favor, verifica tu correo electrónico.',
                usuario: {
                    id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email
                }
            });
        } catch (error) {
            console.error('Error al enviar correo de verificación:', error);
            // Si falla el envío del correo, eliminamos el usuario
            await User.findByIdAndDelete(usuario._id);
            res.status(500).json({ error: 'Error al enviar el correo de verificación' });
        }
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar si el usuario está verificado
        if (!usuario.verificado) {
            return res.status(401).json({ error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión' });
        }

        // Verificar contraseña
        const esValida = await usuario.comparePassword(password);
        if (!esValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Actualizar último login
        usuario.lastLogin = new Date();
        await usuario.save();

        // Generar token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                role: usuario.role
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error al iniciar sesión' });
    }
});

// Ruta para mostrar el formulario de registro
router.get('/registro', (req, res) => {
    res.render('registro', { 
        title: 'Registro de Usuario',
        error: null
    });
});

// Ruta para mostrar el formulario de login
router.get('/login', (req, res) => {
    res.render('login', { 
        title: 'Iniciar Sesión',
        error: null
    });
});

// Ruta para mostrar el perfil del usuario
router.get('/perfil', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.user.userId).select('-password');
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.render('perfil', { 
            title: 'Mi Perfil',
            usuario
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({ error: 'Error al obtener el perfil' });
    }
});

// Verificación de cuenta
router.get('/verificar/:token', async (req, res) => {
    try {
        const usuario = await User.findOne({
            tokenVerificacion: req.params.token,
            tokenExpiracion: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.render('verificacion', {
                title: 'Verificación de Cuenta',
                error: 'Token inválido o expirado'
            });
        }

        usuario.verificado = true;
        usuario.tokenVerificacion = undefined;
        usuario.tokenExpiracion = undefined;
        await usuario.save();

        res.render('verificacion', {
            title: 'Verificación de Cuenta',
            mensaje: 'Cuenta verificada exitosamente'
        });
    } catch (error) {
        console.error('Error en verificación:', error);
        res.render('verificacion', {
            title: 'Verificación de Cuenta',
            error: 'Error al verificar la cuenta'
        });
    }
});

module.exports = router; 