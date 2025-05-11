const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

// Mostrar formulario de registro
router.get('/register', (req, res) => {
    res.render('auth/register', { 
        title: 'Registro',
        error: null
    });
});

// Procesar registro
router.post('/register', async (req, res) => {
    try {
        const { nombre, email, password, membresia } = req.body;

        // Verificar si el usuario ya existe
        const usuarioExistente = await User.findOne({ email });
        if (usuarioExistente) {
            return res.render('auth/register', {
                title: 'Registro',
                error: 'El correo electrónico ya está registrado'
            });
        }

        // Crear nuevo usuario
        const usuario = new User({
            nombre,
            email,
            password,
            membresia: membresia || 'basica'
        });

        // Guardar usuario
        await usuario.save();

        // Iniciar sesión automáticamente
        req.session.userId = usuario._id;
        req.session.user = {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            membresia: usuario.membresia
        };

        res.redirect('/');
    } catch (error) {
        console.error('Error en registro:', error);
        res.render('auth/register', {
            title: 'Registro',
            error: 'Error al registrar usuario'
        });
    }
});

// Mostrar formulario de login
router.get('/login', (req, res) => {
    res.render('auth/login', {
        title: 'Iniciar Sesión',
        error: null
    });
});

// Procesar login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const usuario = await User.findOne({ email });
        if (!usuario) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const passwordValido = await bcrypt.compare(password, usuario.password);
        if (!passwordValido) {
            return res.render('auth/login', {
                title: 'Iniciar Sesión',
                error: 'Credenciales inválidas'
            });
        }

        // Iniciar sesión
        req.session.userId = usuario._id;
        req.session.user = {
            id: usuario._id,
            nombre: usuario.nombre,
            email: usuario.email,
            membresia: usuario.membresia
        };

        res.redirect('/');
    } catch (error) {
        console.error('Error en login:', error);
        res.render('auth/login', {
            title: 'Iniciar Sesión',
            error: 'Error al iniciar sesión'
        });
    }
});

// Cerrar sesión
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// Actualizar membresía
router.post('/actualizar-membresia', isAuthenticated, async (req, res) => {
    try {
        const { membresia } = req.body;
        const usuario = await User.findById(req.session.userId);
        
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        usuario.membresia = membresia;
        await usuario.save();

        // Actualizar sesión
        req.session.user.membresia = membresia;

        res.json({ 
            success: true, 
            membresia: membresia 
        });
    } catch (error) {
        console.error('Error al actualizar membresía:', error);
        res.status(500).json({ error: 'Error al actualizar membresía' });
    }
});

module.exports = router; 