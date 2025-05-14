const Factura = require('../models/Factura');
const Recordatorio = require('../models/Recordatorio');

// Obtener análisis de consumo
exports.getAnalisisConsumo = async (req, res) => {
    try {
        const userId = req.user._id;
        const facturas = await Factura.find({ usuario: userId })
            .sort({ fechaEmision: -1 });

        // Calcular consumo promedio
        const consumos = facturas.map(f => f.consumo.consumoTotal);
        const promedio = consumos.reduce((a, b) => a + b, 0) / consumos.length;

        // Obtener consumo actual
        const consumoActual = facturas[0]?.consumo.consumoTotal || 0;

        // Calcular tendencia (últimos 3 meses)
        const ultimos3Meses = facturas.slice(0, 3);
        const tendencia = ultimos3Meses.map(f => f.consumo.consumoTotal);

        // Predicción simple (promedio de los últimos 3 meses)
        const prediccion = tendencia.reduce((a, b) => a + b, 0) / tendencia.length;

        // Verificar si el consumo actual es elevado (20% más que el promedio)
        if (consumoActual > promedio * 1.2) {
            await Recordatorio.create({
                usuario: userId,
                tipo: 'CONSUMO_ELEVADO',
                mensaje: `Tu consumo actual (${consumoActual}m³) es ${Math.round((consumoActual/promedio - 1) * 100)}% mayor que tu promedio (${Math.round(promedio)}m³)`,
                fecha: new Date(),
                datos: {
                    consumoActual,
                    consumoPromedio: promedio,
                    diferencia: consumoActual - promedio,
                    prediccion
                }
            });
        }

        res.json({
            consumoActual,
            promedio,
            tendencia,
            prediccion,
            alerta: consumoActual > promedio * 1.2
        });
    } catch (error) {
        console.error('Error en análisis de consumo:', error);
        res.status(500).json({ error: 'Error al analizar el consumo' });
    }
};

// Generar reporte mensual
exports.getReporteMensual = async (req, res) => {
    try {
        const userId = req.user._id;
        const { mes, año } = req.query;

        const inicioMes = new Date(año, mes - 1, 1);
        const finMes = new Date(año, mes, 0);

        const facturas = await Factura.find({
            usuario: userId,
            fechaEmision: {
                $gte: inicioMes,
                $lte: finMes
            }
        });

        const totalConsumo = facturas.reduce((sum, f) => sum + f.consumo.consumoTotal, 0);
        const totalPagar = facturas.reduce((sum, f) => sum + f.valores.total, 0);

        res.json({
            mes,
            año,
            totalFacturas: facturas.length,
            totalConsumo,
            totalPagar,
            facturas
        });
    } catch (error) {
        console.error('Error en reporte mensual:', error);
        res.status(500).json({ error: 'Error al generar el reporte' });
    }
};

// Obtener recordatorios
exports.getRecordatorios = async (req, res) => {
    try {
        const userId = req.user._id;
        const recordatorios = await Recordatorio.find({ 
            usuario: userId,
            leido: false 
        }).sort({ fecha: -1 });

        res.json(recordatorios);
    } catch (error) {
        console.error('Error al obtener recordatorios:', error);
        res.status(500).json({ error: 'Error al obtener recordatorios' });
    }
};

// Marcar recordatorio como leído
exports.marcarLeido = async (req, res) => {
    try {
        const { id } = req.params;
        await Recordatorio.findByIdAndUpdate(id, { leido: true });
        res.json({ mensaje: 'Recordatorio marcado como leído' });
    } catch (error) {
        console.error('Error al marcar recordatorio:', error);
        res.status(500).json({ error: 'Error al marcar recordatorio' });
    }
}; 