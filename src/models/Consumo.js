const mongoose = require('mongoose');

const consumoSchema = new mongoose.Schema({
    Mes: {
        type: String,
        required: true
    },
    'Consumo Bogotá (m3-mes)': {
        type: String,
        required: true
    },
    'Consumo Soacha (m3-mes)': {
        type: String,
        required: true
    },
    'Consumo Gachancipá (m3-mes)': {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Consumo', consumoSchema); 