const express = require('express');
const router = express.Router();
const paypal = require('@paypal/checkout-server-sdk');
const auth = require('../middleware/auth');
const User = require('../models/User');

// Configuración de PayPal
let environment = new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID,
    process.env.PAYPAL_CLIENT_SECRET
);
let client = new paypal.core.PayPalHttpClient(environment);

// Endpoint para webhooks de PayPal
router.post('/webhook', async (req, res) => {
    console.log('Webhook recibido - Headers:', req.headers);
    console.log('Webhook recibido - Body:', req.body);

    try {
        // Verificar que el evento sea de PayPal
        if (!req.body || !req.body.event_type) {
            console.log('Evento inválido recibido');
            return res.status(400).json({ error: 'Evento inválido' });
        }

        // Responder inmediatamente para evitar timeouts
        res.status(200).json({ received: true });

        const event = req.body;
        console.log('Procesando evento:', event.event_type);
        
        if (event.event_type.startsWith('PAYMENT.CAPTURE')) {
            // Procesar el evento según su tipo
            switch (event.event_type) {
                case 'PAYMENT.CAPTURE.COMPLETED':
                    console.log('Pago completado:', event.resource);
                    // Actualizar estado de membresía si es necesario
                    if (event.resource.custom_id) {
                        const [userId, tipo] = event.resource.custom_id.split('_');
                        if (tipo === 'membresia') {
                            await User.findByIdAndUpdate(userId, {
                                'membresia.activa': true,
                                'membresia.fechaInicio': new Date(),
                                'membresia.fechaFin': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            });
                            console.log('Membresía actualizada para usuario:', userId);
                        }
                    }
                    break;
                case 'PAYMENT.CAPTURE.DENIED':
                    console.log('Pago denegado:', event.resource);
                    break;
                case 'PAYMENT.CAPTURE.PENDING':
                    console.log('Pago pendiente:', event.resource);
                    break;
                case 'PAYMENT.CAPTURE.REFUNDED':
                    console.log('Pago reembolsado:', event.resource);
                    // Actualizar estado de membresía si es necesario
                    if (event.resource.custom_id) {
                        const [userId, tipo] = event.resource.custom_id.split('_');
                        if (tipo === 'membresia') {
                            await User.findByIdAndUpdate(userId, {
                                'membresia.activa': false
                            });
                            console.log('Membresía desactivada para usuario:', userId);
                        }
                    }
                    break;
            }
        }
    } catch (error) {
        console.error('Error en webhook:', error);
        // No enviamos error al cliente ya que ya respondimos con 200
    }
});

// Crear orden de PayPal
router.post('/crear-orden', auth, async (req, res) => {
    try {
        const { monto, tipo, plan } = req.body;
        
        // Verificar si el usuario ya tiene una membresía activa
        if (tipo === 'membresia') {
            const usuario = await User.findById(req.user._id);
            if (usuario.membresia && usuario.membresia.activa) {
                return res.status(400).json({ 
                    error: 'Ya tienes una membresía activa' 
                });
            }
        }

        let request = new paypal.orders.OrdersCreateRequest();
        request.prefer("return=representation");
        request.requestBody({
            intent: 'CAPTURE',
            purchase_units: [{
                amount: {
                    currency_code: 'USD',
                    value: monto
                },
                description: tipo === 'donacion' ? 'Donación' : `Membresía ${plan}`,
                custom_id: tipo === 'membresia' ? `${req.user._id}_membresia` : undefined
            }],
            application_context: {
                return_url: `${process.env.BASE_URL}/pagos/exito`,
                cancel_url: `${process.env.BASE_URL}/pagos/cancelado`
            }
        });

        const order = await client.execute(request);
        res.json({ id: order.result.id });
    } catch (error) {
        console.error('Error al crear orden PayPal:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Capturar pago
router.post('/capturar/:orderId', auth, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { tipo, plan } = req.body;

        let request = new paypal.orders.OrdersCaptureRequest(orderId);
        const capture = await client.execute(request);

        // Actualizar estado del usuario según el tipo de pago
        if (tipo === 'membresia') {
            await User.findByIdAndUpdate(req.user._id, {
                'membresia.plan': plan,
                'membresia.activa': true,
                'membresia.fechaInicio': new Date(),
                'membresia.fechaFin': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 días
            });
        }

        res.json({
            mensaje: 'Pago procesado exitosamente',
            detalles: capture.result
        });
    } catch (error) {
        console.error('Error al capturar pago:', error);
        res.status(500).json({ error: 'Error al procesar el pago' });
    }
});

// Ruta de éxito
router.get('/exito', (req, res) => {
    res.json({ mensaje: 'Pago procesado exitosamente' });
});

// Ruta de cancelación
router.get('/cancelado', (req, res) => {
    res.json({ mensaje: 'Pago cancelado' });
});

module.exports = router; 