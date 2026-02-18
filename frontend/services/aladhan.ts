
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

export const calculateQibla = (lat: number, lng: number) => {
  const meccaLat = 21.4225 * (Math.PI / 180);
  const meccaLng = 39.8262 * (Math.PI / 180);
  const userLat = lat * (Math.PI / 180);
  const userLng = lng * (Math.PI / 180);

  const y = Math.sin(meccaLng - userLng);
  const x = Math.cos(userLat) * Math.tan(meccaLat) - Math.sin(userLat) * Math.cos(meccaLng - userLng);
  const qibla = Math.atan2(y, x) * (180 / Math.PI);
  return (qibla + 360) % 360;
};
