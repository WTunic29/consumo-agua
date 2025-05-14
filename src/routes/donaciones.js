const express = require('express');
const router = express.Router();
const Donacion = require('../models/Donacion');
const auth = require('../middleware/auth');
const crypto = require('crypto');

// Crear nueva donación
router.post('/', auth, async (req, res) => {
    try {
        const { monto, tipo, metodoPago, detallesPago } = req.body;
        
        // Validar monto mínimo
        if (monto < 1000) {
            return res.status(400).json({ error: 'El monto mínimo de donación es $1.000 COP' });
        }

        // Crear nueva donación
        const donacion = new Donacion({
            usuario: req.user._id,
            monto,
            tipo,
            metodoPago,
            detallesPago,
            referenciaNu: Donacion.generarReferencia()
        });

        await donacion.save();

        // Calcular token para Nu
        const token = donacion.generarTokenNu();

        // Preparar datos para Nu
        const nuData = {
            merchantId: process.env.NU_MERCHANT_ID,
            description: `Donación ${tipo === 'mensual' ? 'mensual' : 'única'} - ConsumoAgua`,
            referenceCode: donacion.referenciaNu,
            amount: monto,
            currency: 'COP',
            token: token,
            test: process.env.NODE_ENV === 'development' ? '1' : '0',
            buyerEmail: req.user.email,
            responseUrl: `${process.env.BASE_URL}/donaciones/respuesta`,
            confirmationUrl: `${process.env.BASE_URL}/donaciones/confirmacion`
        };

        res.json({
            mensaje: 'Donación creada exitosamente',
            donacion,
            nuData
        });
    } catch (error) {
        console.error('Error al crear donación:', error);
        res.status(500).json({ error: 'Error al procesar la donación' });
    }
});

// Ruta de respuesta de Nu
router.post('/respuesta', async (req, res) => {
    try {
        const {
            referenceCode,
            transactionState,
            token,
            amount,
            currency
        } = req.body;

        // Verificar token
        const donacion = await Donacion.findOne({ referenciaNu: referenceCode });
        if (!donacion) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        const calculatedToken = donacion.generarTokenNu();
        if (calculatedToken !== token) {
            return res.status(400).json({ error: 'Token inválido' });
        }

        // Actualizar estado de la donación
        donacion.estado = transactionState === 'APPROVED' ? 'completada' : 'fallida';
        donacion.fechaPago = new Date();
        await donacion.save();

        // Redirigir según el estado
        if (transactionState === 'APPROVED') {
            res.redirect('/donaciones/exito');
        } else {
            res.redirect('/donaciones/error');
        }
    } catch (error) {
        console.error('Error al procesar respuesta de Nu:', error);
        res.redirect('/donaciones/error');
    }
});

// Ruta de confirmación de Nu
router.post('/confirmacion', async (req, res) => {
    try {
        const {
            referenceCode,
            transactionState,
            token,
            amount,
            currency
        } = req.body;

        // Verificar token
        const donacion = await Donacion.findOne({ referenciaNu: referenceCode });
        if (!donacion) {
            return res.status(404).json({ error: 'Donación no encontrada' });
        }

        const calculatedToken = donacion.generarTokenNu();
        if (calculatedToken !== token) {
            return res.status(400).json({ error: 'Token inválido' });
        }

        // Actualizar estado de la donación
        donacion.estado = transactionState === 'APPROVED' ? 'completada' : 'fallida';
        donacion.fechaPago = new Date();
        await donacion.save();

        res.status(200).json({ mensaje: 'Confirmación procesada' });
    } catch (error) {
        console.error('Error al procesar confirmación de Nu:', error);
        res.status(500).json({ error: 'Error al procesar confirmación' });
    }
});

// Obtener historial de donaciones del usuario
router.get('/historial', auth, async (req, res) => {
    try {
        const donaciones = await Donacion.find({ usuario: req.user._id })
            .sort({ fechaCreacion: -1 });
        res.json(donaciones);
    } catch (error) {
        console.error('Error al obtener historial de donaciones:', error);
        res.status(500).json({ error: 'Error al obtener historial' });
    }
});

module.exports = router; 