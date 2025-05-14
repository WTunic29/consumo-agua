const Donacion = require('../models/Donacion');
const Membresia = require('../models/Membresia');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuración del transporter de email
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Función para validar token Nu
const validarTokenNu = (token, datos) => {
    const apiKey = process.env.NU_API_KEY;
    const merchantId = process.env.NU_MERCHANT_ID;
    const { referencia, monto, moneda } = datos;
    
    const firmaCalculada = crypto
        .createHash('sha256')
        .update(`${apiKey}~${merchantId}~${referencia}~${monto}~${moneda}`)
        .digest('hex');
    
    return token === firmaCalculada;
};

// Función para enviar email de confirmación
const enviarEmailConfirmacion = async (email, tipo, detalles) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: `Confirmación de ${tipo === 'donacion' ? 'Donación' : 'Membresía'}`,
        html: `
            <h1>¡Gracias por tu ${tipo === 'donacion' ? 'donación' : 'suscripción'}!</h1>
            <p>Detalles de la transacción:</p>
            <ul>
                <li>Referencia: ${detalles.referencia}</li>
                <li>Monto: $${detalles.monto} COP</li>
                <li>Fecha: ${new Date().toLocaleDateString()}</li>
            </ul>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error al enviar email:', error);
    }
};

// Controlador para procesar donación
exports.procesarDonacion = async (req, res) => {
    try {
        const { monto, tipo, metodoPago, detallesPago } = req.body;
        
        // Validar monto mínimo
        if (monto < 1000) {
            return res.status(400).json({ error: 'El monto mínimo de donación es $1.000 COP' });
        }

        // Crear nueva donación
        const donacion = new Donacion({
            usuario: req.user ? req.user._id : null,
            monto,
            tipo,
            metodoPago,
            detallesPago,
            referenciaNu: Donacion.generarReferencia()
        });

        // Si es donación mensual, configurar renovación
        if (tipo === 'mensual') {
            const fechaProximoCargo = new Date();
            fechaProximoCargo.setMonth(fechaProximoCargo.getMonth() + 1);
            
            donacion.mensual = {
                activa: true,
                fechaProximoCargo,
                renovacionAutomatica: true
            };
        }

        await donacion.save();

        // Generar token para Nu
        const token = donacion.generarTokenNu();

        // Preparar datos para Nu
        const nuData = {
            merchantId: process.env.NU_MERCHANT_ID,
            referenceCode: donacion.referenciaNu,
            amount: donacion.monto,
            currency: 'COP',
            token,
            responseUrl: `${process.env.BASE_URL}/donaciones/respuesta`,
            confirmationUrl: `${process.env.BASE_URL}/donaciones/confirmacion`
        };

        res.json({ 
            mensaje: 'Donación creada exitosamente',
            nuData
        });

    } catch (error) {
        console.error('Error al procesar donación:', error);
        res.status(500).json({ error: 'Error al procesar la donación' });
    }
};

// Controlador para procesar membresía
exports.procesarMembresia = async (req, res) => {
    try {
        const { plan, metodoPago, detallesPago } = req.body;
        
        // Validar que el usuario esté autenticado
        if (!req.user) {
            return res.status(401).json({ error: 'Debe iniciar sesión para adquirir una membresía' });
        }

        // Definir precios según el plan
        const precios = {
            basico: 5000,
            pro: 10000,
            empresarial: 25000
        };

        // Crear nueva membresía
        const membresia = new Membresia({
            usuario: req.user._id,
            plan,
            precio: precios[plan],
            metodoPago,
            detallesPago,
            referenciaNu: Membresia.generarReferencia(),
            fechaFin: new Date(new Date().setMonth(new Date().getMonth() + 1))
        });

        await membresia.save();

        // Generar token para Nu
        const token = membresia.generarTokenNu();

        // Preparar datos para Nu
        const nuData = {
            merchantId: process.env.NU_MERCHANT_ID,
            referenceCode: membresia.referenciaNu,
            amount: membresia.precio,
            currency: 'COP',
            token,
            responseUrl: `${process.env.BASE_URL}/membresias/respuesta`,
            confirmationUrl: `${process.env.BASE_URL}/membresias/confirmacion`
        };

        res.json({ 
            mensaje: 'Membresía creada exitosamente',
            nuData
        });

    } catch (error) {
        console.error('Error al procesar membresía:', error);
        res.status(500).json({ error: 'Error al procesar la membresía' });
    }
};

// Controlador para webhook de Nu
exports.webhookNu = async (req, res) => {
    try {
        const { referencia, estado, token, tipo } = req.body;
        
        // Validar token
        if (!validarTokenNu(token, req.body)) {
            return res.status(400).json({ error: 'Token inválido' });
        }

        if (tipo === 'donacion') {
            const donacion = await Donacion.findOne({ referenciaNu: referencia });
            if (!donacion) {
                return res.status(404).json({ error: 'Donación no encontrada' });
            }

            donacion.estado = estado === 'APPROVED' ? 'completada' : 'fallida';
            await donacion.save();

            if (estado === 'APPROVED') {
                await enviarEmailConfirmacion(
                    donacion.detallesPago.email,
                    'donacion',
                    {
                        referencia: donacion.referenciaNu,
                        monto: donacion.monto
                    }
                );
            }
        } else if (tipo === 'membresia') {
            const membresia = await Membresia.findOne({ referenciaNu: referencia });
            if (!membresia) {
                return res.status(404).json({ error: 'Membresía no encontrada' });
            }

            membresia.estado = estado === 'APPROVED' ? 'activa' : 'inactiva';
            await membresia.save();

            if (estado === 'APPROVED') {
                await enviarEmailConfirmacion(
                    membresia.detallesPago.email,
                    'membresia',
                    {
                        referencia: membresia.referenciaNu,
                        monto: membresia.precio
                    }
                );
            }
        }

        res.status(200).json({ mensaje: 'Webhook procesado correctamente' });
    } catch (error) {
        console.error('Error en webhook:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Controlador para obtener estado de donación/membresía
exports.obtenerEstado = async (req, res) => {
    try {
        const { referencia, tipo } = req.params;
        
        if (tipo === 'donacion') {
            const donacion = await Donacion.findOne({ referenciaNu: referencia });
            if (!donacion) {
                return res.status(404).json({ error: 'Donación no encontrada' });
            }
            res.json({ estado: donacion.estado });
        } else if (tipo === 'membresia') {
            const membresia = await Membresia.findOne({ referenciaNu: referencia });
            if (!membresia) {
                return res.status(404).json({ error: 'Membresía no encontrada' });
            }
            res.json({ estado: membresia.estado });
        } else {
            res.status(400).json({ error: 'Tipo inválido' });
        }
    } catch (error) {
        console.error('Error al obtener estado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}; 