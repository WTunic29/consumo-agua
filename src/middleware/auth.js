const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            console.log('No se recibió token');
            return res.status(401).render('login', {
                error: 'Por favor inicie sesión para continuar'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            console.log('Usuario no encontrado para el token');
            return res.status(401).render('login', {
                error: 'Sesión expirada o inválida'
            });
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).render('login', {
                error: 'Token inválido'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).render('login', {
                error: 'Sesión expirada'
            });
        }
        return res.status(401).render('login', {
            error: 'Error de autenticación'
        });
    }
};

module.exports = auth; 