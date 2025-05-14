const express = require('express');
const router = express.Router();
const anuncioController = require('../controllers/anuncioController');
const { esAdmin } = require('../middleware/auth');

// Rutas públicas
router.get('/:ubicacion', anuncioController.getAnuncios);
router.post('/:id/click', anuncioController.registrarClick);

// Rutas protegidas (solo admin)
router.use(esAdmin);
router.post('/', anuncioController.crearAnuncio);
router.put('/:id', anuncioController.actualizarAnuncio);
router.delete('/:id', anuncioController.eliminarAnuncio);

module.exports = router; 