const express = require('express');
const router = express.Router();
const analisisController = require('../controllers/analisisController');
const auth = require('../middleware/auth');

// Rutas protegidas que requieren autenticación
router.get('/consumo', auth, analisisController.getAnalisisConsumo);
router.get('/reporte-mensual', auth, analisisController.getReporteMensual);
router.get('/recordatorios', auth, analisisController.getRecordatorios);
router.put('/recordatorios/:id/leido', auth, analisisController.marcarLeido);

module.exports = router; 