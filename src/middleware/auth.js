const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Verificar que el header de autorización existe
        if (!req.header('Authorization')) {
            console.log('No se encontró el header de autorización');
            return res.status(401).json({ error: 'No se proporcionó token de autenticación' });
        }

        // Extraer el token del header
        const authHeader = req.header('Authorization');
        if (!authHeader.startsWith('Bearer ')) {
            console.log('Formato de token inválido');
            return res.status(401).json({ error: 'Formato de token inválido' });
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token recibido:', token);

        if (!token) {
            console.log('Token vacío');
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decodificado:', decoded);

            const user = await User.findOne({ _id: decoded.userId });
            if (!user) {
                console.log('Usuario no encontrado para el token');
                return res.status(401).json({ error: 'Usuario no encontrado' });
            }

            req.token = token;
            req.user = user;
            next();
        } catch (jwtError) {
            console.error('Error al verificar el token:', jwtError);
            return res.status(401).json({ error: 'Token inválido o expirado' });
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        res.status(500).json({ error: 'Error en el servidor de autenticación' });
    }
};

module.exports = auth; 