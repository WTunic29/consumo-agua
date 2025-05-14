const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const auth = require('../middleware/auth');
const { validarFactura } = require('../middleware/validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const facturaController = require('../controllers/facturaController');
const rateLimit = require('express-rate-limit');
const { body, query } = require('express-validator');

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 peticiones por ventana
});

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

// Obtener todas las facturas del usuario
router.get('/', facturaController.getFacturas);

// Obtener facturas con paginación y filtros
router.get('/', validarFiltros, facturaController.getFacturas);

// Crear factura con imagen
router.post('/', 
    upload.single('imagen'),
    validarFactura,
    async (req, res) => {
        try {
            const facturaData = {
                usuario: req.user._id,
                ...req.body
            };

            // Subir imagen a Cloudinary si existe
            if (req.file) {
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;
                const resultado = await cloudinary.uploader.upload(dataURI, {
                    folder: 'facturas',
                    resource_type: 'image',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                });
                facturaData.imagenFactura = resultado.secure_url;
            }

            const nuevaFactura = new Factura(facturaData);
            await nuevaFactura.save();

            // Enviar notificación
            await enviarNotificacion(req.user._id, 'Nueva factura registrada', 
                `Se ha registrado la factura ${nuevaFactura.numeroFactura}`);

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

// Mostrar formulario de pago
router.get('/:id/pagar', facturaController.mostrarFormularioPago);

// Procesar pago de factura
router.post('/:id/pagar', facturaController.procesarPago);

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

        // Eliminar imagen de Cloudinary si existe
        if (factura.imagenFactura) {
            const publicId = factura.imagenFactura.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
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

// Sistema de notificaciones
async function enviarNotificacion(usuarioId, titulo, mensaje) {
    try {
        const usuario = await User.findById(usuarioId);
        if (usuario.perfil.preferenciasNotificacion.email) {
            // Enviar email
            // Implementar lógica de envío de email
        }
        // Guardar notificación en la base de datos
        await Notificacion.create({
            usuario: usuarioId,
            titulo,
            mensaje,
            fecha: new Date()
        });
    } catch (error) {
        console.error('Error al enviar notificación:', error);
    }
}

module.exports = router;
