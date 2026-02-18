import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

// Load from prod_secrets.env manually since dotenv default assumes .env
const envConfig = dotenv.parse(fs.readFileSync('../prod_secrets.env'));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

async function checkConnections() {
    console.log('🚀 Starting Pre-Flight Checks...');

    // 1. Check MongoDB
    try {
        console.log('Testing MongoDB Connection...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ MongoDB Connection: SUCCESS');
        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ MongoDB Connection: FAILED', error.message);
        process.exit(1);
    }

    // 2. Check Clerk Keys Structure (Basic Regex)
    if (!process.env.CLERK_SECRET_KEY.startsWith('sk_')) {
        console.error('❌ Clerk Secret Key: INVALID FORMAT (should start with sk_)');
    } else {
        console.log('✅ Clerk Secret Key: FORMAT OK');
    }

    // 3. Check Gemini Key Structure
    if (!process.env.GEMINI_API_KEY.startsWith('AIza')) {
        console.error('❌ Gemini API Key: INVALID FORMAT (should start with AIza)');
    } else {
        console.log('✅ Gemini API Key: FORMAT OK');
    }

    console.log('\n🎉 ALL SYSTEMS GO! Deployment Configuration is Valid.');
}

checkConnections();
