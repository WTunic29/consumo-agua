const express = require('express');
const router = express.Router();
const Consumo = require('../models/Consumo');
const Stats = require('../models/Stats');
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

// Ruta para obtener datos en formato GeoJSON para ArcGIS
router.get('/arcgis/geojson', async (req, res) => {
    try {
        const stats = await Stats.find({}).sort({ fecha: -1 }).lean();
        
        const geojson = {
            type: 'FeatureCollection',
            features: stats.map(stat => ({
                type: 'Feature',
                geometry: {
                    type: 'Point',
                    coordinates: [stat.coordenadas.lng, stat.coordenadas.lat]
                },
                properties: {
                    zona: stat.zona,
                    consumo: stat.consumo,
                    fecha: stat.fecha,
                    eficiencia_hidrica: stat.metricas_sostenibilidad?.eficiencia_hidrica || 0,
                    consumo_per_capita: stat.metricas_sostenibilidad?.consumo_per_capita || 0,
                    ahorro_mensual: stat.metricas_sostenibilidad?.ahorro_mensual || 0,
                    alertas: stat.alertas || []
                }
            }))
        };

        res.json(geojson);
    } catch (error) {
        console.error('Error al generar GeoJSON:', error);
        res.status(500).json({ error: 'Error al generar datos para ArcGIS' });
    }
});

module.exports = router; 