const Anuncio = require('../models/Anuncio');

// Obtener anuncios por ubicación
exports.getAnuncios = async (req, res) => {
    try {
        const { ubicacion } = req.params;
        const anuncios = await Anuncio.obtenerAnunciosActivos(ubicacion, req.user);
        
        // Registrar impresiones
        await Promise.all(anuncios.map(anuncio => anuncio.registrarImpresion()));
        
        res.json(anuncios);
    } catch (error) {
        console.error('Error al obtener anuncios:', error);
        res.status(500).json({ error: 'Error al obtener anuncios' });
    }
};

// Registrar click en anuncio
exports.registrarClick = async (req, res) => {
    try {
        const { id } = req.params;
        const anuncio = await Anuncio.findById(id);
        
        if (!anuncio) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }
        
        await anuncio.registrarClick();
        res.json({ mensaje: 'Click registrado exitosamente' });
    } catch (error) {
        console.error('Error al registrar click:', error);
        res.status(500).json({ error: 'Error al registrar click' });
    }
};

// Crear nuevo anuncio (solo admin)
exports.crearAnuncio = async (req, res) => {
    try {
        const anuncio = new Anuncio(req.body);
        await anuncio.save();
        res.status(201).json(anuncio);
    } catch (error) {
        console.error('Error al crear anuncio:', error);
        res.status(500).json({ error: 'Error al crear anuncio' });
    }
};

// Actualizar anuncio (solo admin)
exports.actualizarAnuncio = async (req, res) => {
    try {
        const { id } = req.params;
        const anuncio = await Anuncio.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!anuncio) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }
        
        res.json(anuncio);
    } catch (error) {
        console.error('Error al actualizar anuncio:', error);
        res.status(500).json({ error: 'Error al actualizar anuncio' });
    }
};

// Eliminar anuncio (solo admin)
exports.eliminarAnuncio = async (req, res) => {
    try {
        const { id } = req.params;
        const anuncio = await Anuncio.findByIdAndDelete(id);
        
        if (!anuncio) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }
        
        res.json({ mensaje: 'Anuncio eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar anuncio:', error);
        res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
}; 