const Factura = require('../models/Factura');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { validationResult } = require('express-validator');

/**
 * Obtiene las facturas del usuario con filtros y paginación
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getFacturas = async (req, res) => {
    try {
        // Validar parámetros de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
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
                default:
                    return res.status(400).json({ error: 'Rango de monto inválido' });
            }
        }

        // Optimizar consulta usando proyección
        const facturas = await Factura.find(filtros)
            .select('numeroFactura fechaEmision monto estado consumo')
            .sort({ fechaEmision: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Factura.countDocuments(filtros);
        const totalPaginas = Math.ceil(total / limit);

        const estadisticas = await calcularEstadisticas(req.user._id);

        res.render('facturas/index', {
            facturas,
            user: req.user,
            paginaActual: page,
            totalPaginas,
            estadisticas
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).render('error', {
            mensaje: 'Error al obtener las facturas',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
};

/**
 * Exporta las facturas a PDF
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.exportarPDF = async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.user._id })
            .select('numeroFactura fechaEmision monto estado consumo')
            .sort({ fechaEmision: -1 })
            .lean();

        if (!facturas.length) {
            return res.status(404).json({ error: 'No hay facturas para exportar' });
        }

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

/**
 * Exporta las facturas a Excel
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.exportarExcel = async (req, res) => {
    try {
        const facturas = await Factura.find({ usuario: req.user._id })
            .select('numeroFactura fechaEmision monto estado consumo')
            .sort({ fechaEmision: -1 })
            .lean();

        if (!facturas.length) {
            return res.status(404).json({ error: 'No hay facturas para exportar' });
        }

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

/**
 * Calcula estadísticas de consumo del usuario
 * @param {string} userId - ID del usuario
 * @returns {Object} Estadísticas de consumo
 */
async function calcularEstadisticas(userId) {
    try {
        const facturas = await Factura.find({ usuario: userId })
            .select('consumo fechaEmision')
            .sort({ fechaEmision: -1 })
            .limit(12)
            .lean();

        if (!facturas.length) {
            return {
                consumoPromedio: 0,
                promedioZona: 0,
                tendencia: 'estable',
                variacion: 0
            };
        }

        const consumoPromedio = facturas.reduce((acc, f) => acc + (f.consumo?.consumoTotal || 0), 0) / facturas.length;
        const promedioZona = consumoPromedio * 1.2; // 20% más que el promedio del usuario

        const tendencia = facturas[0]?.consumo?.consumoTotal < facturas[1]?.consumo?.consumoTotal ? 'bajando' : 'subiendo';
        const variacion = facturas.length > 1 ? 
            ((facturas[0].consumo?.consumoTotal - facturas[1].consumo?.consumoTotal) / facturas[1].consumo?.consumoTotal * 100).toFixed(2) : 0;

        return {
            consumoPromedio,
            promedioZona,
            tendencia,
            variacion
        };
    } catch (error) {
        console.error('Error al calcular estadísticas:', error);
        return {
            consumoPromedio: 0,
            promedioZona: 0,
            tendencia: 'estable',
            variacion: 0
        };
    }
}

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