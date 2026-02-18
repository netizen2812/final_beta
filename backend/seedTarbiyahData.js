import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TarbiyahProgress from './src/models/TarbiyahProgress.js';
import TarbiyahUserStats from './src/models/TarbiyahUserStats.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

// Sample data for testing
const sampleChildUserId = 'test-child-123';

const sampleLessons = [
    {
        childUserId: sampleChildUserId,
        lessonId: 'lesson-1',
        lessonTitle: 'Welcome to Ramadan',
        badge: 'Ramadan Starter 🌙',
        videoWatchedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        quizAttempts: [
            {
                attemptedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                score: 100
            }
        ],
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        xpEarned: 50
    },
    {
        childUserId: sampleChildUserId,
        lessonId: 'lesson-2',
        lessonTitle: 'The Wise Little Ant',
        badge: 'Quran Explorer 🐜',
        videoWatchedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        quizAttempts: [
            {
                attemptedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                score: 90
            }
        ],
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        xpEarned: 50
    },
    {
        childUserId: sampleChildUserId,
        lessonId: 'lesson-3',
        lessonTitle: 'The Hoopoe Bird',
        badge: 'Story Seeker 🐦‍⬛',
        videoWatchedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        quizAttempts: [
            {
                attemptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                score: 85
            }
        ],
        completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        xpEarned: 50
    },
    {
        childUserId: sampleChildUserId,
        lessonId: 'lesson-4',
        lessonTitle: 'The People of the Cave',
        badge: '',
        videoWatchedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        quizAttempts: [
            {
                attemptedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                completedAt: null,
                score: 0
            }
        ],
        completedAt: null,
        xpEarned: 0
    }
];

const sampleUserStats = {
    childUserId: sampleChildUserId,
    dailyLimitMinutes: 45,
    contentFilter: 'Age: 5-8 Years',
    reportCardEnabled: true,
    totalXP: 150,
    level: 3
};

async function seedData() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data for this test child
        await TarbiyahProgress.deleteMany({ childUserId: sampleChildUserId });
        await TarbiyahUserStats.deleteMany({ childUserId: sampleChildUserId });
        console.log('🗑️  Cleared existing test data');

        // Insert sample lessons
        await TarbiyahProgress.insertMany(sampleLessons);
        console.log('✅ Inserted sample lessons');

        // Insert user stats
        await TarbiyahUserStats.create(sampleUserStats);
        console.log('✅ Inserted user stats');

        console.log('\n📊 Sample Data Summary:');
        console.log(`   Child User ID: ${sampleChildUserId}`);
        console.log(`   Completed Lessons: 3`);
        console.log(`   In-Progress Lessons: 1`);
        console.log(`   Total Badges: 3`);
        console.log(`   Total XP: 150`);
        console.log(`   Level: 3`);
        console.log('\n✅ Seed data created successfully!');
        console.log(`\n🔗 Test the API:`);
        console.log(`   GET http://localhost:5000/api/tarbiyah/parent/dashboard/${sampleChildUserId}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedData();
