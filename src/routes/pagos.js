const express = require('express');
const router = express.Router();
const pagosController = require('../controllers/pagosController');
const { verificarToken } = require('../middleware/auth');

// Rutas para donaciones
router.post('/donaciones/procesar', pagosController.procesarDonacion);
router.post('/donaciones/webhook', pagosController.webhookNu);
router.get('/donaciones/estado/:referencia', pagosController.obtenerEstado);

// Rutas para membresías (requieren autenticación)
router.post('/membresias/procesar', verificarToken, pagosController.procesarMembresia);
router.post('/membresias/webhook', pagosController.webhookNu);
router.get('/membresias/estado/:referencia', verificarToken, pagosController.obtenerEstado);

module.exports = router; 