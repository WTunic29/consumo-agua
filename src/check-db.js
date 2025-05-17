const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabase() {
    try {
        // Conectar a MongoDB
        await mongoose.connect('mongodb://localhost:27017/AcueductoDB');
        console.log('Conectado a MongoDB');

        // Obtener la base de datos
        const db = mongoose.connection.db;

        // Listar todas las colecciones
        const collections = await db.listCollections().toArray();
        console.log('\nColecciones disponibles:');
        console.log(collections.map(c => c.name));

        // Verificar datos en la colección stats
        const statsCount = await db.collection('stats').countDocuments();
        console.log('\nNúmero de documentos en stats:', statsCount);
        
        if (statsCount > 0) {
            const stats = await db.collection('stats').find().toArray();
            console.log('\nDatos en stats:');
            console.log(JSON.stringify(stats, null, 2));
        }

        // Verificar datos en la colección consumos
        const consumosCount = await db.collection('consumos').countDocuments();
        console.log('\nNúmero de documentos en consumos:', consumosCount);
        
        if (consumosCount > 0) {
            const consumos = await db.collection('consumos').find().toArray();
            console.log('\nDatos en consumos:');
            console.log(JSON.stringify(consumos, null, 2));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nConexión cerrada');
    }
}

checkDatabase(); 