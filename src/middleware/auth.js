const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.verificarToken = async (req, res, next) => {
    try {
        // Obtener el token del header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Buscar el usuario
        const usuario = await User.findById(decoded.userId);
        if (!usuario) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // Agregar el usuario al request
        req.user = usuario;
        next();
    } catch (error) {
        console.error('Error en verificación de token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
}; 