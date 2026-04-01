import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const userSchema = new mongoose.Schema({
    email: String,
    role: String,
    features: { liveAccess: Boolean }
});

const childSchema = new mongoose.Schema({
    name: String,
    parent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const User = mongoose.model('User', userSchema);
const Child = mongoose.model('Child', childSchema);

async function findParentsOfChildren() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const children = await Child.find({}).populate('parent_id');
        let output = "CHILDREN AND PARENTS:\n\n";
        children.forEach(c => {
            output += `Child: ${c.name}, Parent Email: ${c.parent_id?.email || 'Unknown'}\n`;
        });
        fs.writeFileSync('child_parent_map.txt', output);
        await mongoose.disconnect();
    } catch (err) {
        fs.writeFileSync('child_parent_map.txt', "Error: " + err.message);
    }
}

findParentsOfChildren();
