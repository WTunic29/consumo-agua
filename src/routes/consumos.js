const express = require('express');
const router = express.Router();
const Consumo = require('../models/Consumo');
const auth = require('../middleware/auth');

// Obtener todos los consumos
router.get('/', auth, async (req, res) => {
    try {
        const consumos = await Consumo.find().sort({ Mes: 1 });
        res.json(consumos);
    } catch (error) {
        console.error('Error al obtener consumos:', error);
        res.status(500).json({ error: 'Error al obtener los datos de consumo' });
    }
});

// Obtener consumo por mes
router.get('/:mes', auth, async (req, res) => {
    try {
        const consumo = await Consumo.findOne({ Mes: req.params.mes });
        if (!consumo) {
            return res.status(404).json({ error: 'Consumo no encontrado' });
        }
        res.json(consumo);
    } catch (error) {
        console.error('Error al obtener consumo:', error);
        res.status(500).json({ error: 'Error al obtener el dato de consumo' });
    }
});

// Crear nuevo consumo
router.post('/', auth, async (req, res) => {
    try {
        const consumo = new Consumo(req.body);
        await consumo.save();
        res.status(201).json(consumo);
    } catch (error) {
        console.error('Error al crear consumo:', error);
        res.status(500).json({ error: 'Error al crear el dato de consumo' });
    }
});

// Actualizar consumo
router.put('/:id', auth, async (req, res) => {
    try {
        const consumo = await Consumo.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!consumo) {
            return res.status(404).json({ error: 'Consumo no encontrado' });
        }
        res.json(consumo);
    } catch (error) {
        console.error('Error al actualizar consumo:', error);
        res.status(500).json({ error: 'Error al actualizar el dato de consumo' });
    }
});

// Eliminar consumo
router.delete('/:id', auth, async (req, res) => {
    try {
        const consumo = await Consumo.findByIdAndDelete(req.params.id);
        if (!consumo) {
            return res.status(404).json({ error: 'Consumo no encontrado' });
        }
        res.json({ mensaje: 'Consumo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar consumo:', error);
        res.status(500).json({ error: 'Error al eliminar el dato de consumo' });
    }
});

module.exports = router; 