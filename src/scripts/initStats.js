const mongoose = require('mongoose');
const Stats = require('../models/Stats');
require('dotenv').config();

async function inicializarDatos() {
    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/AcueductoDB');
        console.log('Conectado a MongoDB');

        // Inicializar datos
        await Stats.inicializarDatos();
        console.log('Datos inicializados correctamente');

        // Verificar datos
        const stats = await Stats.find();
        console.log('Datos actuales en la base de datos:');
        stats.forEach(stat => {
            console.log(`\nZona: ${stat.zona}`);
            console.log(`Coordenadas: ${stat.coordenadas.lat}, ${stat.coordenadas.lng}`);
            console.log(`Consumo: ${stat.consumo} m³`);
            console.log('Métricas de sostenibilidad:');
            console.log(`- Eficiencia hídrica: ${stat.metricas_sostenibilidad.eficiencia_hidrica}%`);
            console.log(`- Consumo per cápita: ${stat.metricas_sostenibilidad.consumo_per_capita} m³/persona`);
            console.log(`- Ahorro mensual: ${stat.metricas_sostenibilidad.ahorro_mensual}%`);
            console.log(`- Huella hídrica: ${stat.metricas_sostenibilidad.huella_hidrica}`);
        });

    } catch (error) {
        console.error('Error al inicializar datos:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Desconectado de MongoDB');
    }
}

inicializarDatos(); 