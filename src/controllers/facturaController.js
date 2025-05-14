const Factura = require('../models/Factura');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Función para calcular estadísticas
const calcularEstadisticas = async (userId) => {
    try {
        const facturas = await Factura.find({ usuario: userId })
            .sort({ fechaEmision: -1 })
            .limit(12);

        const estadisticas = {
            consumoPromedio: 0,
            montoPromedio: 0,
            facturasPagadas: 0,
            facturasPendientes: 0,
            facturasVencidas: 0,
            consumoMensual: []
        };

        if (facturas.length > 0) {
            // Calcular promedios
            const totalConsumo = facturas.reduce((sum, f) => sum + (f.consumo?.consumoTotal || 0), 0);
            const totalMonto = facturas.reduce((sum, f) => sum + (f.monto || 0), 0);
            
            estadisticas.consumoPromedio = totalConsumo / facturas.length;
            estadisticas.montoPromedio = totalMonto / facturas.length;

            // Contar estados
            facturas.forEach(factura => {
                switch(factura.estado) {
                    case 'pagada':
                        estadisticas.facturasPagadas++;
                        break;
                    case 'pendiente':
                        estadisticas.facturasPendientes++;
                        break;
                    case 'vencida':
                        estadisticas.facturasVencidas++;
                        break;
                }
            });

            // Preparar datos para gráficos
            estadisticas.consumoMensual = facturas.map(factura => ({
                mes: new Date(factura.fechaEmision).toLocaleDateString('es-ES', { month: 'short' }),
                consumo: factura.consumo?.consumoTotal || 0
            }));
        }

        return estadisticas;
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
        return {
            consumoPromedio: 0,
            montoPromedio: 0,
            facturasPagadas: 0,
            facturasPendientes: 0,
            facturasVencidas: 0,
            consumoMensual: []
        };
    }
};

// Obtener todas las facturas del usuario con filtros y paginación
exports.getFacturas = async (req, res) => {
    try {
        if (!req.user || !req.user._id) {
            return res.status(401).render('login', {
                error: 'Por favor inicie sesión para continuar'
            });
        }

        const page = parseInt(req.query.pagina) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filtros = { usuario: req.user._id };
        
        if (req.query.estado) {
            filtros.estado = req.query.estado;
        }
        
        if (req.query.fechaDesde || req.query.fechaHasta) {
            filtros.fechaEmision = {};
            if (req.query.fechaDesde) {
                filtros.fechaEmision.$gte = new Date(req.query.fechaDesde);
            }
            if (req.query.fechaHasta) {
                filtros.fechaEmision.$lte = new Date(req.query.fechaHasta);
            }
        }

        if (req.query.rangoMonto) {
            switch(req.query.rangoMonto) {
                case 'bajo':
                    filtros.monto = { $lt: 50000 };
                    break;
                case 'medio':
                    filtros.monto = { $gte: 50000, $lte: 100000 };
                    break;
                case 'alto':
                    filtros.monto = { $gt: 100000 };
                    break;
            }
        }

        // Obtener facturas con paginación
        const facturas = await Factura.find(filtros)
            .sort({ fechaEmision: -1 })
            .skip(skip)
            .limit(limit);

        // Obtener total de documentos para la paginación
        const total = await Factura.countDocuments(filtros);
        const totalPaginas = Math.ceil(total / limit);

        // Obtener estadísticas de consumo
        const estadisticas = await calcularEstadisticas(req.user._id);

        res.render('facturas/index', {
            facturas,
            user: req.user,
            paginaActual: page,
            totalPaginas,
            estadisticas,
            error: null
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).render('error', {
            mensaje: 'Error al obtener las facturas',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

// Exportar facturas a PDF
exports.exportarPDF = async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.user._id })
            .sort({ fechaEmision: -1 });

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=facturas.pdf');

        doc.pipe(res);

        // Título
        doc.fontSize(20).text('Historial de Facturas', { align: 'center' });
        doc.moveDown();

        // Tabla de facturas
        facturas.forEach(factura => {
            doc.fontSize(12).text(`Factura #${factura.numeroFactura}`);
            doc.fontSize(10).text(`Fecha: ${new Date(factura.fechaEmision).toLocaleDateString()}`);
            doc.text(`Monto: $${factura.monto.toLocaleString()}`);
            doc.text(`Estado: ${factura.estado}`);
            doc.text(`Consumo: ${factura.consumo?.consumoTotal || 0} m³`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        res.status(500).json({ error: 'Error al generar el PDF' });
    }
};

// Exportar facturas a Excel
exports.exportarExcel = async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.user._id })
            .sort({ fechaEmision: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Facturas');

        // Definir columnas
        worksheet.columns = [
            { header: 'Número', key: 'numero', width: 15 },
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Monto', key: 'monto', width: 15 },
            { header: 'Estado', key: 'estado', width: 15 },
            { header: 'Consumo (m³)', key: 'consumo', width: 15 }
        ];

        // Agregar datos
        facturas.forEach(factura => {
            worksheet.addRow({
                numero: factura.numeroFactura,
                fecha: new Date(factura.fechaEmision).toLocaleDateString(),
                monto: factura.monto,
                estado: factura.estado,
                consumo: factura.consumo?.consumoTotal || 0
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=facturas.xlsx');

        await workbook.xlsx.write(res);
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        res.status(500).json({ error: 'Error al generar el Excel' });
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