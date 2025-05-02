const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const auth = require('../middleware/auth');

// Crear factura
router.post('/', auth, async (req, res) => {
    try {
        const nuevaFactura = new Factura({
            usuario: req.user._id, // Usar el ID del usuario autenticado
            ...req.body
        });
        await nuevaFactura.save();
        res.status(201).json({
            mensaje: 'Factura registrada exitosamente',
            factura: nuevaFactura
        });
    } catch (error) {
        console.error('Error al registrar factura:', error);
        res.status(500).json({ error: 'Error al registrar factura' });
    }
});

// Obtener todas las facturas del usuario
router.get('/', auth, async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.user._id })
            .sort({ fechaEmision: -1 });
        res.json(facturas);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
});

// Obtener una factura específica
router.get('/:id', auth, async (req, res) => {
    try {
        const factura = await Factura.findOne({
            _id: req.params.id,
            usuario: req.user._id
        });
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        res.json(factura);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la factura' });
    }
});

// Actualizar factura
router.put('/:id', auth, async (req, res) => {
    try {
        const factura = await Factura.findOneAndUpdate(
            { 
                _id: req.params.id,
                usuario: req.user._id
            },
            req.body,
            { new: true }
        );

        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json(factura);
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la factura' });
    }
});

// Eliminar factura
router.delete('/:id', auth, async (req, res) => {
    try {
        const factura = await Factura.findOneAndDelete({
            _id: req.params.id,
            usuario: req.user._id
        });

        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({ mensaje: 'Factura eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la factura' });
    }
});

module.exports = router;
