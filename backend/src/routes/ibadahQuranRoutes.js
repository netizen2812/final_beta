import express from 'express';
import { syncQuranProgress, getQuranProgress } from '../controller/ibadahController.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

// Get the user's saved Quran progress
router.get('/progress', requireAuth, getQuranProgress);

// Sync the user's local Quran progress to the backend
router.post('/sync-progress', requireAuth, syncQuranProgress);

export default router;
