const mongoose = require('mongoose');
const Factura = require('../models/Factura');
const NotificacionService = require('../services/notificacionService');
require('dotenv').config();

async function programarNotificaciones() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Conectado a MongoDB');

        // Obtener facturas pendientes que vencen en los próximos 3 días
        const hoy = new Date();
        const tresDiasDespues = new Date(hoy.getTime() + (3 * 24 * 60 * 60 * 1000));

        const facturasPendientes = await Factura.find({
            estado: 'pendiente',
            fechaVencimiento: {
                $gte: hoy,
                $lte: tresDiasDespues
            }
        });

        console.log(`Encontradas ${facturasPendientes.length} facturas pendientes`);

        // Enviar notificaciones
        for (const factura of facturasPendientes) {
            await NotificacionService.notificarRecordatorioPago(factura._id);
        }

        // Verificar y actualizar estados de membresía
        const facturasPagadas = await Factura.find({
            estado: 'pagada',
            'beneficios.rachaPagos': { $exists: true }
        }).populate('usuario');

        for (const factura of facturasPagadas) {
            const rachaPagos = factura.beneficios.rachaPagos;
            
            if (rachaPagos === 6) {
                await NotificacionService.notificarLogroMembresia(factura.usuario._id, 'premium');
            } else if (rachaPagos === 12) {
                await NotificacionService.notificarLogroMembresia(factura.usuario._id, 'vip');
            }
        }

        console.log('Notificaciones programadas exitosamente');
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Ejecutar la función
programarNotificaciones(); 