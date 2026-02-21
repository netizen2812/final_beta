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
        const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000";
        const url = `${API_URL}/api/ibadah/declination?lat=${lat}&lng=${lng}`;
        const res = await fetch(url, { mode: 'cors' });
        if (!res.ok) return 0;
        const data = await res.json();
        return Number(data.declination);
    } catch (e) {
        console.error("Declination Proxy API Error", e);
        return 0;
    }
};
