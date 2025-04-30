const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    Mes: String,
    "Consumo Bogotá (m3-mes)": String,
    "Consumo Soacha (m3-mes)": String,
    "Consumo Gachancipá (m3-mes)": String
}, { collection: 'stats' });

module.exports = mongoose.model('Stats', statsSchema, 'stats'); 