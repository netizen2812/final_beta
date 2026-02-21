const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const getPrayerTimings = async (lat?: number, lng?: number) => {
  try {
    const query = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
    const res = await fetch(`${API_URL}/api/ibadah/timings${query}`);
    const data = await res.json();
    return data; // Return full object to get metadata (method)
  } catch (e) {
    console.error("Prayer Timings API error", e);
    return null;
  }
};

export const getHijriDate = async () => {
  try {
    const res = await fetch(`${API_URL}/api/ibadah/hijri`);
    const data = await res.json();
    return data.data;
  } catch (e) {
    console.error("Hijri Date API error", e);
    return null;
  }
};

export const getCalendarMonth = async (lat: number | null, lng: number | null, month: number, year: number) => {
  try {
    const locQuery = lat && lng ? `&lat=${lat}&lng=${lng}` : '';
    const res = await fetch(`${API_URL}/api/ibadah/calendar?month=${month}&year=${year}${locQuery}`);
    const data = await res.json();
    return data.data;
  } catch (e) {
    console.error("Calendar API error", e);
    return [];
  }
};

export const formatDateForAPI = (date: Date) => {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
};

// Kaaba coordinates (exact) — true north bearing via great-circle formula
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/**
 * True geodesic bearing from user (lat, lng) to Kaaba.
 * Uses great-circle formula; radians required. Returns TRUE NORTH bearing 0–360°.
 * Validation: Pilani ~266°, Delhi ~266°, London ~118° (error ≤ 2°).
 */
export const calculateQibla = (lat: number, lng: number): number => {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const toDeg = (rad: number) => rad * (180 / Math.PI);

  const φ1 = toRad(lat);
  const λ1 = toRad(lng);
  const φ2 = toRad(KAABA_LAT);
  const λ2 = toRad(KAABA_LNG);
  const Δλ = λ2 - λ1;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearingRad = Math.atan2(y, x);
  const bearingDegrees = (toDeg(bearingRad) + 360) % 360;

  return bearingDegrees;
};

/**
 * Magnetic declination (degrees) at (lat, lng). East positive, West negative.
 * Proxy route through backend cache for extremely fast resolution.
 */
export const getMagneticDeclination = async (lat: number, lng: number): Promise<number> => {
  try {
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
