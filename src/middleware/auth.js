const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        console.log('Token recibido:', token);
        if (!token) {
            console.log('No se recibió token');
            throw new Error('No autorizado');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            console.log('Usuario no encontrado para el token');
            throw new Error('No autorizado');
        }

        req.token = token;
        req.user = user;
        next();
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(401).json({ error: 'Por favor autentíquese' });
    }
};

module.exports = auth; 