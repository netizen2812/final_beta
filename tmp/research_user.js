import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Note: Using relative paths assuming this is run from CwD: c:\Users\acer\Downloads\FaithTech\FaithTech
import User from './backend/src/models/User.js';
import Child from './backend/src/models/Child.js';
import Batch from './backend/src/models/Batch.js';

async function research() {
    try {
        const uri = 'mongodb://localhost:27017/faithtech';
        console.log('Connecting to:', uri);
        await mongoose.connect(uri);
        
        const email = '190030028.alum23@iitdh.ac.in';
        const user = await User.findOne({ email });
        console.log('User Found:', user ? { id: user._id, name: user.name, features: user.features } : 'No');

        if (user) {
            const children = await Child.find({ parent_id: user._id });
            console.log('Children:', children.map(c => ({ id: c._id, name: c.name })));
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
