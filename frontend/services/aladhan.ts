
export const getPrayerTimings = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=2`);
    const data = await res.json();
    return data.data;
  } catch (e) {
    console.error("Prayer Timings API error", e);
    return null;
  }
};

export const getHijriDate = async () => {
  try {
    const today = new Date();
    const res = await fetch(`https://api.aladhan.com/v1/gToH/${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`);
    const data = await res.json();
    return data.data.hijri;
  } catch (e) {
    console.error("Hijri Date API error", e);
    return null;
  }
};

export const getCalendarMonth = async (lat: number, lng: number, month: number, year: number) => {
  try {
    const res = await fetch(`https://api.aladhan.com/v1/calendar?latitude=${lat}&longitude=${lng}&month=${month}&year=${year}&method=2`);
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
 * trueHeading = magneticHeading + declination (then normalize 0–360).
 * Tries NOAA geomag API; fallback 0 if unavailable.
 */
export const getMagneticDeclination = async (lat: number, lng: number): Promise<number> => {
  try {
    const year = new Date().getFullYear();
    const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat=${lat}&lon=${lng}&model=WMM&startYear=${year}&resultFormat=json`;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return 0;
    const data = await res.json();
    const decl = data.declination?.value ?? data.result?.[0]?.declination ?? 0;
    return Number(decl);
  } catch {
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.ngdc.noaa.gov/geomag-web/calculators/calculateDeclination?lat=${lat}&lon=${lng}&model=WMM&startYear=${new Date().getFullYear()}&resultFormat=json`)}`;
      const res = await fetch(proxyUrl);
      if (!res.ok) return 0;
      const text = await res.text();
      const data = JSON.parse(text);
      const decl = data.declination?.value ?? data.result?.[0]?.declination ?? 0;
      return Number(decl);
    } catch {
      return 0;
    }
  }
};
