// --- FUNCIONALIDAD DE DONACIONES INACTIVA TEMPORALMENTE ---
// Para reactivar, descomenta las rutas y controladores según sea necesario.

// const express = require('express');
// const router = express.Router();
// const Donacion = require('../models/Donacion');
// const auth = require('../middleware/auth');
// const crypto = require('crypto');

// // Crear nueva donación
// router.post('/', auth, async (req, res) => {
//     try {
//         const { monto, tipo } = req.body;
        
//         // Validar monto mínimo
//         if (monto < 1000) {
//             return res.status(400).json({ error: 'El monto mínimo de donación es $1.000 COP' });
//         }

//         // Crear nueva donación
//         const donacion = new Donacion({
//             usuario: req.user._id,
//             monto,
//             tipo,
//             referenciaPayU: Donacion.generarReferencia()
//         });

//         await donacion.save();

//         // Calcular firma para PayU
//         const signature = donacion.calcularFirmaPayU();

//         // Preparar datos para PayU
//         const payuData = {
//             merchantId: process.env.PAYU_MERCHANT_ID,
//             accountId: process.env.PAYU_ACCOUNT_ID,
//             description: `Donación ${tipo === 'mensual' ? 'mensual' : 'única'} - ConsumoAgua`,
//             referenceCode: donacion.referenciaPayU,
//             amount: monto,
//             tax: 0,
//             taxReturnBase: 0,
//             currency: 'COP',
//             signature: signature,
//             test: process.env.NODE_ENV === 'development' ? '1' : '0',
//             buyerEmail: req.user.email,
//             responseUrl: `${process.env.BASE_URL}/donaciones/respuesta`,
//             confirmationUrl: `${process.env.BASE_URL}/donaciones/confirmacion`
//         };

//         res.json({
//             mensaje: 'Donación creada exitosamente',
//             donacion,
//             payuData
//         });
//     } catch (error) {
//         console.error('Error al crear donación:', error);
//         res.status(500).json({ error: 'Error al procesar la donación' });
//     }
// });

// Ruta de respuesta de PayU
// router.post('/respuesta', async (req, res) => {
//     try {
//         const {
//             referenceCode,
//             transactionState,
//             signature,
//             amount,
//             currency
//         } = req.body;

//         // Verificar firma
//         const donacion = await Donacion.findOne({ referenciaPayU: referenceCode });
//         if (!donacion) {
//             return res.status(404).json({ error: 'Donación no encontrada' });
//         }

//         const calculatedSignature = donacion.calcularFirmaPayU();
//         if (calculatedSignature !== signature) {
//             return res.status(400).json({ error: 'Firma inválida' });
//         }

//         // Actualizar estado de la donación
//         donacion.estado = transactionState === '4' ? 'completada' : 'fallida';
//         donacion.fechaPago = new Date();
//         await donacion.save();

//         // Redirigir según el estado
//         if (transactionState === '4') {
//             res.redirect('/donaciones/exito');
//         } else {
//             res.redirect('/donaciones/error');
//         }
//     } catch (error) {
//         console.error('Error al procesar respuesta de PayU:', error);
//         res.redirect('/donaciones/error');
//     }
// });

// Ruta de confirmación de PayU
// router.post('/confirmacion', async (req, res) => {
//     try {
//         const {
//             referenceCode,
//             transactionState,
//             signature,
//             amount,
//             currency
//         } = req.body;

//         // Verificar firma
//         const donacion = await Donacion.findOne({ referenciaPayU: referenceCode });
//         if (!donacion) {
//             return res.status(404).json({ error: 'Donación no encontrada' });
//         }

//         const calculatedSignature = donacion.calcularFirmaPayU();
//         if (calculatedSignature !== signature) {
//             return res.status(400).json({ error: 'Firma inválida' });
//         }

//         // Actualizar estado de la donación
//         donacion.estado = transactionState === '4' ? 'completada' : 'fallida';
//         donacion.fechaPago = new Date();
//         await donacion.save();

//         res.status(200).json({ mensaje: 'Confirmación procesada' });
//     } catch (error) {
//         console.error('Error al procesar confirmación de PayU:', error);
//         res.status(500).json({ error: 'Error al procesar confirmación' });
//     }
// });

// Obtener historial de donaciones del usuario
// router.get('/historial', auth, async (req, res) => {
//     try {
//         const donaciones = await Donacion.find({ usuario: req.user._id })
//             .sort({ fechaCreacion: -1 });
//         res.json(donaciones);
//     } catch (error) {
//         console.error('Error al obtener historial de donaciones:', error);
//         res.status(500).json({ error: 'Error al obtener historial' });
//     }
// });

// module.exports = router; 