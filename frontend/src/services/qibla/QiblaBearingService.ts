export const KAABA_COORDS = {
    lat: 21.4225,
    lng: 39.8262
};

/**
 * Calculates the great-circle bearing from a given location to the Kaaba.
 * Formula: θ = atan2( sin Δλ ⋅ cos φ2 , cos φ1 ⋅ sin φ2 − sin φ1 ⋅ cos φ2 ⋅ cos Δλ )
 * Yields TRUE NORTH geometric bearing.
 */
export const calculateQiblaBearing = (userLat: number, userLng: number): number => {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const toDeg = (rad: number) => rad * (180 / Math.PI);

    const phi1 = toRad(userLat);
    const lambda1 = toRad(userLng);
    const phi2 = toRad(KAABA_COORDS.lat);
    const lambda2 = toRad(KAABA_COORDS.lng);
    const deltaLambda = lambda2 - lambda1;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

    const bearingRad = Math.atan2(y, x);
    const bearingDegrees = (toDeg(bearingRad) + 360) % 360;

    return bearingDegrees;
};

/**
 * Great-circle distance to Kaaba in kilometers (Haversine formula).
 */
export const calculateDistanceToKaaba = (userLat: number, userLng: number): number => {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const R = 6371; // Earth radius in km

    const dLat = toRad(KAABA_COORDS.lat - userLat);
    const dLng = toRad(KAABA_COORDS.lng - userLng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(userLat)) * Math.cos(toRad(KAABA_COORDS.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
