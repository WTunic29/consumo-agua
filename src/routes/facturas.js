const express = require('express');
const router = express.Router();
const Factura = require('../models/Factura');
const auth = require('../middleware/auth');
const { validarFactura } = require('../middleware/validator');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer para subida de imágenes
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Obtener todas las facturas del usuario
router.get('/', auth, async (req, res) => {
    try {
        console.log('Buscando facturas para usuario:', req.user._id);
        const facturas = await Factura.find({ usuario: req.user._id })
            .sort({ fechaEmision: -1 });
        console.log('Facturas encontradas:', facturas.length);
        res.json(facturas);
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ 
            error: 'Error al obtener facturas',
            detalles: error.message 
        });
    }
});

// Obtener facturas con paginación y filtros
router.get('/', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Construir filtros
        const filtros = { usuario: req.user._id };
        if (req.query.estado) filtros.estado = req.query.estado;
        if (req.query.fechaDesde) filtros.fechaEmision = { $gte: new Date(req.query.fechaDesde) };
        if (req.query.fechaHasta) filtros.fechaEmision = { ...filtros.fechaEmision, $lte: new Date(req.query.fechaHasta) };
        if (req.query.numeroFactura) filtros.numeroFactura = new RegExp(req.query.numeroFactura, 'i');

        // Obtener facturas
        const facturas = await Factura.find(filtros)
            .sort({ fechaEmision: -1 })
            .skip(skip)
            .limit(limit);

        // Obtener total de documentos para la paginación
        const total = await Factura.countDocuments(filtros);

        res.json({
            facturas,
            total,
            totalPaginas: Math.ceil(total / limit),
            paginaActual: page
        });
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        res.status(500).json({ 
            error: 'Error al obtener facturas',
            detalles: error.message 
        });
    }
});

// Crear factura con imagen
router.post('/', auth, upload.single('imagen'), validarFactura, async (req, res) => {
    try {
        const facturaData = {
            usuario: req.user._id,
            ...req.body
        };

        // Subir imagen a Cloudinary si existe
        if (req.file) {
            const b64 = Buffer.from(req.file.buffer).toString('base64');
            const dataURI = `data:${req.file.mimetype};base64,${b64}`;
            const resultado = await cloudinary.uploader.upload(dataURI);
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
        res.status(500).json({ 
            error: 'Error al registrar factura',
            detalles: error.message 
        });
    }
});

// Obtener una factura específica
router.get('/:id', auth, async (req, res) => {
    try {
        const factura = await Factura.findOne({
            _id: req.params.id,
            usuario: req.user._id
        });
        if (!factura) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }
        res.json(factura);
    } catch (error) {
        console.error('Error al obtener la factura:', error);
        res.status(500).json({ 
            error: 'Error al obtener la factura',
            detalles: error.message 
        });
    }
});

// Actualizar factura
router.put('/:id', auth, async (req, res) => {
    try {
        const factura = await Factura.findOneAndUpdate(
            { 
                _id: req.params.id,
                usuario: req.user._id
            },
            req.body,
            { new: true }
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
});

// Eliminar factura
router.delete('/:id', auth, async (req, res) => {
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
