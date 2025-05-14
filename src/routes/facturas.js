const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const auth = require('../middleware/auth');
const { validarFactura } = require('../middleware/validator');
const multer = require('multer');
const facturaController = require('../controllers/facturaController');
const { body, query } = require('express-validator');

// Configuración de rate limiting (opcional)
let limiter;
try {
    const rateLimit = require('express-rate-limit');
    limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // límite de 100 peticiones por ventana
    });
} catch (error) {
    console.warn('express-rate-limit no está instalado. El rate limiting está deshabilitado.');
    limiter = (req, res, next) => next();
}

// Configuración de Multer para subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes'));
        }
    }
});

// Middleware de validación
const validarFiltros = [
    query('pagina').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('estado').optional().isIn(['pendiente', 'pagada', 'vencida', 'mora']),
    query('fechaDesde').optional().isISO8601(),
    query('fechaHasta').optional().isISO8601(),
    query('rangoMonto').optional().isIn(['bajo', 'medio', 'alto'])
];

// Rutas protegidas que requieren autenticación
router.use(auth);
router.use(limiter);

// Obtener facturas con paginación y filtros
router.get('/', validarFiltros, facturaController.getFacturas);

// Crear factura
router.post('/', 
    upload.single('imagen'),
    validarFactura,
    async (req, res) => {
        try {
            const facturaData = {
                usuario: req.user._id,
                ...req.body
            };

            const nuevaFactura = new Factura(facturaData);
            await nuevaFactura.save();

            res.status(201).json({
                mensaje: 'Factura registrada exitosamente',
                factura: nuevaFactura
            });
        } catch (error) {
            console.error('Error al registrar factura:', error);
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ 
                    error: 'El archivo es demasiado grande. Máximo 5MB' 
                });
            }
            res.status(500).json({ 
                error: 'Error al registrar factura',
                detalles: error.message 
            });
        }
    }
);

// Ver detalle de una factura
router.get('/:id', facturaController.getFactura);

// Actualizar factura
router.put('/:id', 
    validarFactura,
    async (req, res) => {
        try {
            const factura = await Factura.findOneAndUpdate(
                { 
                    _id: req.params.id,
                    usuario: req.user._id
                },
                req.body,
                { 
                    new: true,
                    runValidators: true
                }
            );

            if (!factura) {
                return res.status(404).json({ error: 'Factura no encontrada' });
            }

            res.json(factura);
        } catch (error) {
            console.error('Error al actualizar la factura:', error);
            res.status(500).json({ 
                error: 'Error al actualizar la factura',
                detalles: error.message 
            });
        }
    }
);

// Eliminar factura
router.delete('/:id', async (req, res) => {
    try {
        const factura = await Factura.findOneAndDelete({
            _id: req.params.id,
            usuario: req.user._id
        });

        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({ mensaje: 'Factura eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar la factura:', error);
        res.status(500).json({ 
            error: 'Error al eliminar la factura',
            detalles: error.message 
        });
    }
});

// Exportar facturas
router.get('/exportar/pdf', facturaController.exportarPDF);
router.get('/exportar/excel', facturaController.exportarExcel);

// Obtener estadísticas
router.get('/estadisticas', facturaController.getEstadisticas);

module.exports = router;
