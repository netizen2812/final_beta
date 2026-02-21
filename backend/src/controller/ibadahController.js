import fetch from "node-fetch";

// Simple in-memory cache to massively reduce frontend loading time
const cache = {
    timings: new Map(),
    hijri: new Map(),
    calendar: new Map(),
    declination: new Map(),
    quranSurahs: null,
    quranSurah: new Map(),
    quranJuz: new Map()
};

const CACHE_TTL = {
    timings: 12 * 60 * 60 * 1000,
    hijri: 12 * 60 * 60 * 1000,
    calendar: 24 * 60 * 60 * 1000,
    declination: 24 * 60 * 60 * 1000,
    quran: 7 * 24 * 60 * 60 * 1000
};

const isExpired = (timestamp, ttl) => Date.now() - timestamp > ttl;

export const getTimings = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

        // Round the coordinates slightly to increase cache hit rate for nearby users
        const roundedLat = parseFloat(lat).toFixed(2);
        const roundedLng = parseFloat(lng).toFixed(2);
        const cacheKey = `${roundedLat}_${roundedLng}`;

        const cached = cache.timings.get(cacheKey);
        if (cached && !isExpired(cached.timestamp, CACHE_TTL.timings)) {
            return res.json({ data: cached.data });
        }

        const response = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`);
        if (!response.ok) throw new Error("Failed to fetch timings");
        const data = await response.json();

        cache.timings.set(cacheKey, { data: data.data, timestamp: Date.now() });
        res.json({ data: data.data });
    } catch (error) {
        console.error("Timings API error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getHijriDate = async (req, res) => {
    try {
        const today = new Date();
        const dateStr = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
        const cacheKey = dateStr;

        const cached = cache.hijri.get(cacheKey);
        if (cached && !isExpired(cached.timestamp, CACHE_TTL.hijri)) {
            return res.json({ data: cached.data });
        }

        const response = await fetch(`https://api.aladhan.com/v1/gToH/${dateStr}`);
        if (!response.ok) throw new Error("Failed to fetch Hijri date");
        const data = await response.json();

        cache.hijri.set(cacheKey, { data: data.data.hijri, timestamp: Date.now() });
        res.json({ data: data.data.hijri });
    } catch (error) {
        console.error("Hijri API error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getCalendarMonth = async (req, res) => {
    try {
        const { lat, lng, month, year } = req.query;
        if (!lat || !lng || !month || !year) return res.status(400).json({ error: "Missing params" });

        const roundedLat = parseFloat(lat).toFixed(2);
        const roundedLng = parseFloat(lng).toFixed(2);
        const cacheKey = `${roundedLat}_${roundedLng}_${month}_${year}`;

        const cached = cache.calendar.get(cacheKey);
        if (cached && !isExpired(cached.timestamp, CACHE_TTL.calendar)) {
            return res.json({ data: cached.data });
        }

        const response = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&month=${month}&year=${year}&method=2`);
        if (!response.ok) throw new Error("Failed to fetch calendar");
        const data = await response.json();

        cache.calendar.set(cacheKey, { data: data.data, timestamp: Date.now() });
        res.json({ data: data.data });
    } catch (error) {
        console.error("Calendar API error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const getMagneticDeclination = async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

        const roundedLat = parseFloat(lat).toFixed(1);
        const roundedLng = parseFloat(lng).toFixed(1);
        const year = new Date().getFullYear();
        const cacheKey = `${roundedLat}_${roundedLng}_${year}`;

        const cached = cache.declination.get(cacheKey);
        if (cached && !isExpired(cached.timestamp, CACHE_TTL.declination)) {
            return res.json({ declination: cached.data });
        }

        const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat=${lat}&lon=${lng}&model=WMM&startYear=${year}&resultFormat=json`;

        let decl = 0;
        try {
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                decl = data.declination?.value ?? data.result?.[0]?.declination ?? 0;
            }
        } catch {
            // Silently fail on error and use 0 declination if NO fallback
        }

        cache.declination.set(cacheKey, { data: Number(decl), timestamp: Date.now() });
        res.json({ declination: Number(decl) });

    } catch (error) {
        console.error("Declination API error:", error);
        res.json({ declination: 0 }); // Fallback
    }
};

export const getSurahs = async (req, res) => {
    try {
        if (cache.quranSurahs && !isExpired(cache.quranSurahs.timestamp, CACHE_TTL.quran)) {
            return res.json(cache.quranSurahs.data);
        }

        const response = await fetch('https://api.alquran.cloud/v1/surah');
        const data = await response.json();

        cache.quranSurahs = { data, timestamp: Date.now() };
        res.json(data);
    } catch (error) {
        console.error("Quran Surahs error:", error);
        res.status(500).json({ error: "Failed to fetch surahs" });
    }
};

export const getSurahDetail = async (req, res) => {
    try {
        const { id } = req.params;
        if (cache.quranSurah.has(id)) {
            const cached = cache.quranSurah.get(id);
            if (!isExpired(cached.timestamp, CACHE_TTL.quran)) return res.json(cached.data);
        }

        const [textRes, transRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/surah/${id}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/en.asad`),
            fetch(`https://api.alquran.cloud/v1/surah/${id}/ar.alafasy`)
        ]);

        const text = await textRes.json();
        const trans = await transRes.json();
        const audio = await audioRes.json();

        const result = { text, trans, audio };
        cache.quranSurah.set(id, { data: result, timestamp: Date.now() });
        res.json(result);
    } catch (error) {
        console.error("Quran Surah detail error:", error);
        res.status(500).json({ error: "Failed to fetch surah content" });
    }
};

export const getJuzDetail = async (req, res) => {
    try {
        const { id } = req.params;
        if (cache.quranJuz.has(id)) {
            const cached = cache.quranJuz.get(id);
            if (!isExpired(cached.timestamp, CACHE_TTL.quran)) return res.json(cached.data);
        }

        const [textRes, transRes, audioRes] = await Promise.all([
            fetch(`https://api.alquran.cloud/v1/juz/${id}/quran-uthmani`),
            fetch(`https://api.alquran.cloud/v1/juz/${id}/en.asad`),
            fetch(`https://api.alquran.cloud/v1/juz/${id}/ar.alafasy`)
        ]);

        const text = await textRes.json();
        const trans = await transRes.json();
        const audio = await audioRes.json();

        const result = { text, trans, audio };
        cache.quranJuz.set(id, { data: result, timestamp: Date.now() });
        res.json(result);
    } catch (error) {
        console.error("Quran Juz detail error:", error);
        res.status(500).json({ error: "Failed to fetch juz content" });
    }
};
