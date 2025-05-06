const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Función para verificar la firma de PayU
function verificarFirmaPayU(referenceCode, amount, currency, signature) {
    const apiKey = process.env.PAYU_API_KEY;
    const merchantId = process.env.PAYU_MERCHANT_ID;
    const signatureString = `${apiKey}~${merchantId}~${referenceCode}~${amount}~${currency}`;
    const calculatedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
    return calculatedSignature === signature;
}

// Ruta para procesar la respuesta de PayU
router.post('/confirmacion', async (req, res) => {
    try {
        const {
            referenceCode,
            amount,
            currency,
            signature,
            state_pol,
            response_code_pol,
            payment_method_type,
            transaction_id
        } = req.body;

        // Verificar la firma
        if (!verificarFirmaPayU(referenceCode, amount, currency, signature)) {
            console.error('Firma inválida en la confirmación de PayU');
            return res.status(400).send('Firma inválida');
        }

        // Verificar el estado de la transacción
        if (state_pol === '4' || state_pol === '7') {
            // Transacción aprobada
            // Aquí puedes guardar la información en tu base de datos
            console.log('Donación exitosa:', {
                referenceCode,
                amount,
                currency,
                paymentMethod: payment_method_type,
                transactionId: transaction_id
            });

            // TODO: Guardar la donación en la base de datos
            // TODO: Enviar email de confirmación al donante
        } else {
            console.error('Transacción fallida:', {
                referenceCode,
                state: state_pol,
                responseCode: response_code_pol
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Error procesando confirmación de PayU:', error);
        res.status(500).send('Error interno');
    }
});

// Ruta para la página de éxito
router.get('/exito', (req, res) => {
    res.render('donacion_exito', {
        title: 'Donación Exitosa',
        message: '¡Gracias por tu donación! Tu apoyo es muy importante para nosotros.'
    });
});

// Ruta para la página de error
router.get('/error', (req, res) => {
    res.render('donacion_error', {
        title: 'Error en la Donación',
        message: 'Hubo un problema al procesar tu donación. Por favor, intenta nuevamente.'
    });
});

module.exports = router; 