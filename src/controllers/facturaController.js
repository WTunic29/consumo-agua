const Factura = require('../models/Factura');

// Obtener todas las facturas del usuario
exports.getFacturas = async (req, res) => {
    try {
        // Actualizar estados de facturas vencidas
        await Factura.actualizarEstadosVencidos();
        
        // Obtener facturas del usuario
        const facturas = await Factura.obtenerFacturasUsuario(req.user._id);
        
        res.render('facturas/index', {
            facturas,
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).render('error', {
            mensaje: 'Error al obtener las facturas',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Obtener una factura específica
exports.getFactura = async (req, res) => {
    try {
        const factura = await Factura.obtenerFactura(req.params.id);
        
        // Verificar que la factura pertenece al usuario
        if (factura.usuario.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                mensaje: 'No tienes permiso para ver esta factura'
            });
        }

        res.render('facturas/detalle', {
            factura,
            user: req.user
        });
    } catch (error) {
        console.error('Error al obtener factura:', error);
        res.status(500).render('error', {
            mensaje: 'Error al obtener la factura',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Mostrar formulario de pago
exports.mostrarFormularioPago = async (req, res) => {
    try {
        const factura = await Factura.obtenerFactura(req.params.id);
        
        // Verificar que la factura pertenece al usuario
        if (factura.usuario.toString() !== req.user._id.toString()) {
            return res.status(403).render('error', {
                mensaje: 'No tienes permiso para pagar esta factura'
            });
        }

        // Verificar que la factura no está pagada
        if (factura.estado === 'pagada') {
            return res.status(400).render('error', {
                mensaje: 'Esta factura ya ha sido pagada'
            });
        }

        res.render('facturas/pago', {
            factura,
            user: req.user
        });
    } catch (error) {
        console.error('Error al mostrar formulario de pago:', error);
        res.status(500).render('error', {
            mensaje: 'Error al mostrar el formulario de pago',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Procesar el pago de la factura
exports.procesarPago = async (req, res) => {
    try {
        const factura = await Factura.obtenerFactura(req.params.id);
        
        // Verificar que la factura pertenece al usuario
        if (factura.usuario.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                error: 'No tienes permiso para pagar esta factura'
            });
        }

        // Verificar que la factura no está pagada
        if (factura.estado === 'pagada') {
            return res.status(400).json({
                error: 'Esta factura ya ha sido pagada'
            });
        }

        // Calcular beneficios por pago puntual
        await factura.calcularBeneficios();

        // Aplicar descuento si existe
        if (factura.beneficios.descuentoAplicado > 0) {
            const descuento = factura.monto * factura.beneficios.descuentoAplicado;
            factura.monto -= descuento;
        }

        // Actualizar estado y fecha de pago
        const facturaActualizada = await Factura.actualizarEstado(factura._id, 'pagada', {
            fechaPago: new Date(),
            beneficios: factura.beneficios,
            membresia: factura.membresia
        });

        // Obtener resumen de beneficios
        const resumenBeneficios = facturaActualizada.obtenerResumenBeneficios();

        res.json({
            mensaje: 'Pago procesado exitosamente',
            factura: facturaActualizada,
            beneficios: resumenBeneficios
        });
    } catch (error) {
        console.error('Error al procesar pago:', error);
        res.status(500).json({
            error: 'Error al procesar el pago'
        });
    }
};

// Obtener resumen de membresía
exports.getResumenMembresia = async (req, res) => {
    try {
        const facturas = await Factura.find({ 
            usuario: req.user._id,
            estado: 'pagada'
        }).sort({ fechaPago: -1 });

        if (facturas.length === 0) {
            return res.json({
                membresia: {
                    tipo: 'basica',
                    beneficios: []
                },
                rachaPagos: 0,
                puntosTotales: 0
            });
        }

        const ultimaFactura = facturas[0];
        const resumenBeneficios = ultimaFactura.obtenerResumenBeneficios();

        res.json({
            membresia: resumenBeneficios.membresia,
            rachaPagos: resumenBeneficios.rachaPagos,
            puntosTotales: facturas.reduce((total, factura) => 
                total + (factura.beneficios?.puntosGanados || 0), 0)
        });
    } catch (error) {
        console.error('Error al obtener resumen de membresía:', error);
        res.status(500).json({
            error: 'Error al obtener resumen de membresía'
        });
    }
}; 