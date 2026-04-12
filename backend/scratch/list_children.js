
import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://ramansingh:0vHu07PogDtsIhak@cluster0.odugkxm.mongodb.net/Tarbiyah?appName=IMAMDB';

async function listChildren() {
    try {
        await mongoose.connect(MONGO_URI);
        const Child = mongoose.model('Child', new mongoose.Schema({
            name: String
        }));
        const children = await Child.find({});
        console.log('Children names:');
        children.forEach(c => console.log(`- ${c.name} (${c._id})`));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
listChildren();
