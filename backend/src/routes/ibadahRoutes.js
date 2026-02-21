import express from 'express';
import { getTimings, getHijriDate, getCalendarMonth, getMagneticDeclination, getSurahs, getSurahDetail, getJuzDetail, getHadithOfTheDay, getMetalPrices } from '../controller/ibadahController.js';

const router = express.Router();

router.get('/timings', getTimings);
router.get('/hijri', getHijriDate);
router.get('/calendar', getCalendarMonth);
router.get('/declination', getMagneticDeclination);

// Quran Proxy
router.get('/quran/surahs', getSurahs);
router.get('/quran/surah/:id', getSurahDetail);
router.get('/quran/juz/:id', getJuzDetail);

// Additional Features
router.get('/hadith/daily', getHadithOfTheDay);
router.get('/zakat/prices', getMetalPrices);

export default router;
