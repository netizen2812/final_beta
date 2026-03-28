import axios from 'axios';
import fs from 'fs';

const fetchAllJuzMetadata = async () => {
    const juzMetadata = {};
    for (let j = 1; j <= 30; j++) {
        console.log(`Fetching Juz ${j}...`);
        try {
            const response = await axios.get(`https://api.alquran.cloud/v1/juz/${j}/en.sahih`);
            const ayahs = response.data.data.ayahs;
            const totalAyahs = ayahs.length;
            const ayahsPerPart = Math.ceil(totalAyahs / 15);
            
            const parts = [];
            for (let p = 1; p <= 15; p++) {
                const startIdx = (p - 1) * ayahsPerPart;
                const endIdx = Math.min(startIdx + ayahsPerPart, totalAyahs) - 1;
                
                if (startIdx >= totalAyahs) break;

                const startAyah = ayahs[startIdx];
                const endAyah = ayahs[endIdx];

                parts.push({
                    part: p,
                    startSurah: startAyah.surah.englishName,
                    startAyah: startAyah.numberInSurah,
                    endSurah: endAyah.surah.englishName,
                    endAyah: endAyah.numberInSurah
                });
            }
            juzMetadata[j] = parts;
        } catch (err) {
            console.error(`Failed Juz ${j}: ${err.message}`);
        }
    }
    fs.writeFileSync('./quran_parts_metadata.json', JSON.stringify(juzMetadata, null, 2));
    console.log('Done! Generated quran_parts_metadata.json');
};

fetchAllJuzMetadata();
