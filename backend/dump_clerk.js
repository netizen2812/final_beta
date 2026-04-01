import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkClient } from '@clerk/clerk-sdk-node';
import fs from 'fs';

dotenv.config();

async function dumpAllClerkUsers() {
    try {
        console.log("Fetching all Clerk users...");
        let allUsers = [];
        let offset = 0;
        let limit = 500;

        const users = await clerkClient.users.getUserList({
            limit: limit,
            offset: offset
        });

        allUsers = users.map(u => ({
            id: u.id,
            emails: u.emailAddresses.map(e => e.emailAddress),
            phones: (u.phoneNumbers || []).map(p => p.phoneNumber),
            createdAt: u.createdAt
        }));

        console.log(`Found ${allUsers.length} total users in Clerk.`);
        fs.writeFileSync('clerk_all_users.txt', JSON.stringify(allUsers, null, 2));
    } catch (err) {
        console.error("Clerk dump failed:", err);
        fs.writeFileSync('clerk_all_users.txt', "Error: " + err.message);
    }
}

dumpAllClerkUsers();
