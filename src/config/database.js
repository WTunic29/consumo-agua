const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log(`MongoDB conectado: ${conn.connection.host}`);
        console.log(`Base de datos: ${conn.connection.name}`);
        
        // Listar colecciones
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('Colecciones disponibles:', collections.map(c => c.name));
        
        // Contar documentos en la colección stats
        const count = await conn.connection.db.collection('stats').countDocuments();
        console.log(`Número de documentos en stats: ${count}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;