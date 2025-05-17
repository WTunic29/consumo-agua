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

// Verificar la configuración del transporter
transporter.verify(function(error, success) {
    if (error) {
        console.error('Error en la configuración del correo:', error);
    } else {
        console.log('Servidor de correo listo para enviar mensajes');
    }
});

// Función para enviar correo de verificación
async function enviarCorreoVerificacion(email, token) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        throw new Error('Configuración de correo electrónico incompleta');
    }

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

    try {
        console.log('Intentando enviar correo a:', email);
        const info = await transporter.sendMail(mailOptions);
        console.log('Correo enviado exitosamente:', info.messageId);
        return info;
    } catch (error) {
        console.error('Error al enviar correo:', error);
        throw new Error('Error al enviar el correo de verificación: ' + error.message);
    }
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
            res.status(500).json({ 
                error: 'Error al enviar el correo de verificación. Por favor, verifica que el correo electrónico sea correcto.',
                detalles: error.message
            });
        }
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            error: 'Error en el servidor',
            detalles: error.message
        });
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

// Ruta para mostrar el formulario de recuperación de contraseña
router.get('/recuperar-contrasena', (req, res) => {
    res.render('recuperar-contrasena', {
        title: 'Recuperar Contraseña',
        error: null
    });
});

// Ruta para procesar la solicitud de recuperación de contraseña
router.post('/recuperar-contrasena', async (req, res) => {
    try {
        const { email } = req.body;
        const usuario = await User.findOne({ email });

        if (!usuario) {
            return res.status(404).json({ error: 'No existe una cuenta con ese correo electrónico' });
        }

        // Generar token de recuperación
        usuario.generatePasswordReset();
        await usuario.save();

        // Enviar correo de recuperación
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de Contraseña - Sistema de Consumo de Agua',
            html: `
                <h1>Recuperación de Contraseña</h1>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
                <a href="${process.env.BASE_URL}/auth/reset-password/${usuario.resetPasswordToken}">Restablecer contraseña</a>
                <p>Este enlace expirará en 1 hora.</p>
                <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ mensaje: 'Se ha enviado un enlace de recuperación a tu correo electrónico' });
    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

// Ruta para mostrar el formulario de restablecimiento de contraseña
router.get('/reset-password/:token', async (req, res) => {
    try {
        const usuario = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.render('reset-password', {
                title: 'Restablecer Contraseña',
                error: 'El enlace de recuperación es inválido o ha expirado',
                token: null
            });
        }

        res.render('reset-password', {
            title: 'Restablecer Contraseña',
            error: null,
            token: req.params.token
        });
    } catch (error) {
        console.error('Error al verificar token:', error);
        res.render('reset-password', {
            title: 'Restablecer Contraseña',
            error: 'Error al procesar la solicitud',
            token: null
        });
    }
});

// Ruta para procesar el restablecimiento de contraseña
router.post('/reset-password/:token', async (req, res) => {
    try {
        const { password } = req.body;
        const usuario = await User.findOne({
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!usuario) {
            return res.status(400).json({ error: 'El enlace de recuperación es inválido o ha expirado' });
        }

        // Actualizar contraseña
        usuario.password = password;
        usuario.resetPasswordToken = undefined;
        usuario.resetPasswordExpires = undefined;
        await usuario.save();

        res.json({ mensaje: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error al restablecer contraseña:', error);
        res.status(500).json({ error: 'Error al restablecer la contraseña' });
    }
});

module.exports = router; 