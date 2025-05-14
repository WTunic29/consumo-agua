const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { esAdmin } = require('../middleware/auth');

// Middleware para verificar que el usuario es administrador
router.use(esAdmin);

// Rutas de beneficios
router.get('/beneficios', adminController.getEstadisticasBeneficios);
router.post('/beneficios/config', adminController.actualizarConfiguracion);
router.post('/beneficios/:id/toggle', adminController.toggleBeneficio);
router.post('/beneficios', adminController.crearBeneficio);
router.delete('/beneficios/:id', adminController.eliminarBeneficio);

module.exports = router; 