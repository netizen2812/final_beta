import geomagnetism from 'geomagnetism';

/**
 * Returns the magnetic declination for a given lat/lng.
 * Positive = East, Negative = West.
 * Uses the World Magnetic Model (WMM) via geomagnetism package.
 */
export const getMagneticDeclination = async (lat: number, lng: number): Promise<number> => {
    try {
        const info = geomagnetism.model().point([lat, lng]);
        // The declination represents how much Magnetic North deviates from True North.
        return info.decl;
    } catch (error) {
        console.error("Geomagnetism model failed:", error);
        // Fallback if the library completely fails (very rare, as it's purely math based on WMM constants)
        return await fallbackDeclinationApi(lat, lng);
    }
};

/**
 * Fallback to NOAA API just in case.
 */
const fallbackDeclinationApi = async (lat: number, lng: number): Promise<number> => {
    try {
        const year = new Date().getFullYear();
        const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat=${lat}&lon=${lng}&model=WMM&startYear=${year}&resultFormat=json`;
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return 0;
        const data = await res.json();
        const decl = data.declination?.value ?? data.result?.[0]?.declination ?? 0;
        return Number(decl);
    } catch {
        return 0; // Better to have 0 than undefined if everything fails.
    }
};
