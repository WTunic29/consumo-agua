const Factura = require('../models/Factura');
const Beneficio = require('../models/Beneficio');
const Configuracion = require('../models/Configuracion');

// Obtener estadísticas de beneficios
exports.getEstadisticasBeneficios = async (req, res) => {
    try {
        const stats = await Factura.aggregate([
            {
                $group: {
                    _id: null,
                    totalMembresias: { $sum: 1 },
                    membresiasPremium: {
                        $sum: { $cond: [{ $eq: ['$membresia.tipo', 'premium'] }, 1, 0] }
                    },
                    membresiasVip: {
                        $sum: { $cond: [{ $eq: ['$membresia.tipo', 'vip'] }, 1, 0] }
                    },
                    puntosTotales: { $sum: '$beneficios.puntosGanados' },
                    totalDescuentos: { $sum: '$beneficios.descuentoAplicado' }
                }
            }
        ]);

        const config = await Configuracion.findOne({ tipo: 'beneficios' });
        const beneficios = await Beneficio.find();

        res.render('admin/beneficios', {
            stats: stats[0] || {
                totalMembresias: 0,
                membresiasPremium: 0,
                membresiasVip: 0,
                puntosTotales: 0,
                totalDescuentos: 0,
                promedioPuntos: 0,
                promedioDescuento: 0
            },
            config: config || {
                puntosPorPago: 10,
                descuentoRacha3: 5
            },
            beneficios
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

// Actualizar configuración de beneficios
exports.actualizarConfiguracion = async (req, res) => {
    try {
        const { puntosPorPago, descuentoRacha3 } = req.body;

        await Configuracion.findOneAndUpdate(
            { tipo: 'beneficios' },
            {
                puntosPorPago: Number(puntosPorPago),
                descuentoRacha3: Number(descuentoRacha3)
            },
            { upsert: true }
        );

        res.json({ mensaje: 'Configuración actualizada exitosamente' });
    } catch (error) {
        console.error('Error al actualizar configuración:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};

// Cambiar estado de un beneficio
exports.toggleBeneficio = async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body;

        await Beneficio.findByIdAndUpdate(id, { activo });
        res.json({ mensaje: 'Estado del beneficio actualizado' });
    } catch (error) {
        console.error('Error al actualizar beneficio:', error);
        res.status(500).json({ error: 'Error al actualizar beneficio' });
    }
};

// Crear nuevo beneficio
exports.crearBeneficio = async (req, res) => {
    try {
        const { nombre, descripcion, tipo, valor } = req.body;

        const beneficio = new Beneficio({
            nombre,
            descripcion,
            tipo,
            valor,
            activo: true
        });

        await beneficio.save();
        res.json({ mensaje: 'Beneficio creado exitosamente', beneficio });
    } catch (error) {
        console.error('Error al crear beneficio:', error);
        res.status(500).json({ error: 'Error al crear beneficio' });
    }
};

// Eliminar beneficio
exports.eliminarBeneficio = async (req, res) => {
    try {
        const { id } = req.params;
        await Beneficio.findByIdAndDelete(id);
        res.json({ mensaje: 'Beneficio eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar beneficio:', error);
        res.status(500).json({ error: 'Error al eliminar beneficio' });
    }
}; 