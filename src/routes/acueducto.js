const express = require('express');
const router = express.Router();
const AcueductoDB = require('../models/AcueductoDB');
const auth = require('../middleware/auth');

// Obtener todos los sectores
router.get('/sectores', async (req, res) => {
    try {
        const sectores = await AcueductoDB.find({}, {
            sector: 1,
            coordenadas: 1,
            'consumo.actual': 1,
            'metricas.eficiencia': 1,
            'alertas': {
                $filter: {
                    input: '$alertas',
                    as: 'alerta',
                    cond: { $eq: ['$$alerta.resuelto', false] }
                }
            }
        });
        res.json(sectores);
    } catch (error) {
        console.error('Error al obtener sectores:', error);
        res.status(500).json({ error: 'Error al obtener los sectores' });
    }
});

// Obtener detalles de un sector específico
router.get('/sectores/:sector', async (req, res) => {
    try {
        const sector = await AcueductoDB.findOne({ sector: req.params.sector });
        if (!sector) {
            return res.status(404).json({ error: 'Sector no encontrado' });
        }
        res.json(sector);
    } catch (error) {
        console.error('Error al obtener sector:', error);
        res.status(500).json({ error: 'Error al obtener el sector' });
    }
});

// Actualizar datos de un sector (solo admin)
router.put('/sectores/:sector', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const sector = await AcueductoDB.findOneAndUpdate(
            { sector: req.params.sector },
            { $set: req.body },
            { new: true }
        );

        if (!sector) {
            return res.status(404).json({ error: 'Sector no encontrado' });
        }

        res.json(sector);
    } catch (error) {
        console.error('Error al actualizar sector:', error);
        res.status(500).json({ error: 'Error al actualizar el sector' });
    }
});

// Obtener alertas activas
router.get('/alertas', async (req, res) => {
    try {
        const alertas = await AcueductoDB.aggregate([
            { $unwind: '$alertas' },
            { $match: { 'alertas.resuelto': false } },
            { $sort: { 'alertas.nivel': -1, 'alertas.fecha': -1 } },
            {
                $project: {
                    sector: 1,
                    alerta: '$alertas'
                }
            }
        ]);
        res.json(alertas);
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({ error: 'Error al obtener las alertas' });
    }
});

// Marcar alerta como resuelta (solo admin)
router.put('/alertas/:sector/:alertaId', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const sector = await AcueductoDB.findOneAndUpdate(
            { 
                sector: req.params.sector,
                'alertas._id': req.params.alertaId
            },
            { 
                $set: { 'alertas.$.resuelto': true }
            },
            { new: true }
        );

        if (!sector) {
            return res.status(404).json({ error: 'Alerta no encontrada' });
        }

        res.json({ mensaje: 'Alerta marcada como resuelta' });
    } catch (error) {
        console.error('Error al actualizar alerta:', error);
        res.status(500).json({ error: 'Error al actualizar la alerta' });
    }
});

module.exports = router; 