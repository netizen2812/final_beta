
import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://ramansingh:0vHu07PogDtsIhak@cluster0.odugkxm.mongodb.net/?appName=IMAMDB';

async function listAll() {
    try {
        const conn = await mongoose.connect(MONGO_URI);
        const admin = new mongoose.mongo.Admin(conn.connection.db);
        const dbs = await admin.listDatabases();
        console.log('Databases:');
        dbs.databases.forEach(db => console.log(`- ${db.name}`));

        // Check collections in current DB
        const collections = await conn.connection.db.listCollections().toArray();
        console.log('\nCollections in current DB:');
        collections.forEach(coll => console.log(`- ${coll.name}`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
listAll();
