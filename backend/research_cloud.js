import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';
import Child from './src/models/Child.js';
import Batch from './src/models/Batch.js';

async function research() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI missing');
        
        console.log('Connecting to cloud DB...');
        await mongoose.connect(uri);
        
        const email = '190030028.alum23@iitdh.ac.in';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found by email:', email);
            process.exit(1);
        }
        
        console.log('User Found:', { id: user._id, name: user.name, email: user.email, features: user.features });

        const children = await Child.find({ parent_id: user._id });
        console.log('Children:', children.map(c => ({ id: c._id, name: c.name })));

        const targetChild = children.find(c => c.name.toLowerCase().includes('hafeez'));
        if (targetChild) {
            console.log('Target Child ID:', targetChild._id);
        } else {
            console.log('Child "Hafeez" not found for this user.');
        }

        const batches = await Batch.find({}).populate('scholar', 'name email');
        console.log('Available Batches:');
        batches.forEach(b => {
            console.log(`- ID: ${b._id}, Name: ${b.name}, Scholar: ${b.scholar?.name || 'N/A'}`);
        });

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

research();
