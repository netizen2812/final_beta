import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import User from './src/models/User.js';
import Child from './src/models/Child.js';
import Batch from './src/models/Batch.js';

async function research() {
    let output = '';
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) throw new Error('MONGO_URI missing');
        
        await mongoose.connect(uri);
        
        const email = '190030028.alum23@iitdh.ac.in';
        const user = await User.findOne({ email });
        
        if (!user) {
            output += `User not found by email: ${email}\n`;
        } else {
            output += `User Found: ${JSON.stringify({ id: user._id, name: user.name, email: user.email, features: user.features }, null, 2)}\n`;

            const children = await Child.find({ parent_id: user._id });
            output += `Children: ${JSON.stringify(children.map(c => ({ id: c._id, name: c.name })), null, 2)}\n`;

            const targetChild = children.find(c => c.name.toLowerCase().includes('hafeez'));
            if (targetChild) {
                output += `Target Child ID: ${targetChild._id}\n`;
            } else {
                output += `Child "Hafeez" not found for this user.\n`;
            }
        }

        const batches = await Batch.find({}).populate('scholar', 'name email');
        output += `Available Batches:\n`;
        batches.forEach(b => {
            output += `- ID: ${b._id}, Name: ${b.name}, Scholar: ${b.scholar?.name || 'N/A'}\n`;
        });

        fs.writeFileSync('research_results.txt', output);
        process.exit(0);
    } catch (err) {
        fs.writeFileSync('research_results.txt', 'Error: ' + err.message);
        process.exit(1);
    }
}

research();
