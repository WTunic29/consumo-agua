const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ _id: decoded.userId });

        if (!user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
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