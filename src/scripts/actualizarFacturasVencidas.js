const mongoose = require('mongoose');
const Factura = require('../models/Factura');
require('dotenv').config();

async function actualizarFacturasVencidas() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('Conectado a MongoDB');

        const facturasActualizadas = await Factura.actualizarEstadosVencidos();
        console.log(`Se actualizaron ${facturasActualizadas} facturas vencidas`);

        await mongoose.connection.close();
        console.log('Conexión cerrada');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

// Ejecutar la función
actualizarFacturasVencidas(); 