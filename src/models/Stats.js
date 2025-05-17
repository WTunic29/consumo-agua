const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    zona: String,
    consumo: Number,
    fecha: Date,
    coordenadas: {
        lat: Number,
        lng: Number
    },
    estadisticas: {
        tamanoAlmacenamiento: Number,
        documentos: Number,
        tamanoPromedio: Number,
        indices: Number,
        tamanoTotalIndices: Number
    },
    metricas_sostenibilidad: {
        eficiencia_hidrica: Number,  // Porcentaje de eficiencia en el uso del agua
        consumo_per_capita: Number,  // Consumo por persona
        ahorro_mensual: Number,      // Porcentaje de ahorro respecto al mes anterior
        huella_hidrica: Number       // Impacto ambiental del consumo
    },
    alertas: [{
        tipo: String,                // 'exceso_consumo', 'fuga_potencial', etc.
        mensaje: String,
        fecha: Date,
        nivel: String               // 'bajo', 'medio', 'alto'
    }]
});

module.exports = mongoose.model('Stats', statsSchema); 