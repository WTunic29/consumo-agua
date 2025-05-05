const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Ruta de registro
router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, email, password, telefono, direccion } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Crear nuevo usuario
        const usuario = new User({
            nombre,
            apellido,
            email,
            password,
            perfil: {
                telefono,
                direccion
            }
        });

        await usuario.save();

        // Generar token
        const token = jwt.sign(
            { userId: usuario._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente',
            token,
            usuario: {
                id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar usuario' });
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

// Ruta para obtener perfil
router.get('/perfil', auth, async (req, res) => {
    try {
        const usuario = await User.findById(req.user._id)
            .select('-password')
            .populate('facturas');
        
        res.json(usuario);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// Ruta para mostrar el formulario de login
router.get('/login', (req, res) => {
    res.render('login', { title: 'Iniciar Sesión' });
});

// Ruta para mostrar el formulario de registro
router.get('/registro', (req, res) => {
    res.render('registro', { title: 'Registro de Usuario' });
});

module.exports = router; 