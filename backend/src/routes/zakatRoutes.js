import express from 'express';
import { calculateZakat } from '../controller/zakatController.js';

const router = express.Router();

router.post('/calculate', calculateZakat);

export default router;
