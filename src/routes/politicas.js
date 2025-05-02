const express = require('express');
const router = express.Router();

// Ruta para mostrar las políticas de uso
router.get('/', (req, res) => {
    res.render('politicas', {
        title: 'Políticas de Uso y Privacidad'
    });
});

module.exports = router; 