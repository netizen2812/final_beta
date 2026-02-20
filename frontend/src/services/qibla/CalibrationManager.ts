/**
 * Manages the logic for when to show a calibration prompt to the user.
 * Accuracy metrics are largely dictated by iOS webkitCompassAccuracy or inferred from noise on Android.
 */
export class CalibrationManager {
    // iOS defines accuracy < 0 as untrusted/uncalibrated, and higher numbers as worse accuracy (in degrees).
    // Ideally, accuracy should be < 15 degrees to be considered "calibrated".
    public static needsCalibration(accuracy: number | null): boolean {
        if (accuracy === null) return false; // If API doesn't support accuracy, we can't reliably trigger it.

        // WebKit specific flag for uncalibrated state
        if (accuracy < 0) return true;

        // If accuracy is worse than 25 degrees of error, they need to calibrate
        if (accuracy > 25) return true;

        return false;
    }

    public static isHighAccuracy(accuracy: number | null): boolean {
        if (accuracy === null) return true; // Optimistic for Android
        return accuracy > 0 && accuracy <= 15;
    }

    public static getConfidenceLevel(accuracy: number | null): "High" | "Medium" | "Low" {
        if (accuracy === null) return "Medium"; // Unknown
        if (accuracy < 0 || accuracy > 40) return "Low";
        if (accuracy <= 15) return "High";
        return "Medium";
    }

    /**
     * Diagnostic sanity check to see if the computed true heading / Qibla
     * makes geographical sense given the user location.
     */
    public static verifyQiblaBearing(lat: number, lng: number, calculatedQibla: number): boolean {
        // Rough bounding boxes
        const inIndia = lat > 8 && lat < 37 && lng > 68 && lng < 97;
        const inUSEast = lat > 24 && lat < 47 && lng > -85 && lng < -65;
        const inEurope = lat > 35 && lat < 70 && lng > -10 && lng < 30;
        const inAustralia = lat > -43 && lat < -10 && lng > 113 && lng < 153;

        if (inIndia && (calculatedQibla < 250 || calculatedQibla > 290)) return false;
        if (inUSEast && (calculatedQibla < 45 || calculatedQibla > 75)) return false;
        if (inEurope && (calculatedQibla < 100 || calculatedQibla > 150)) return false;
        if (inAustralia && (calculatedQibla < 260 || calculatedQibla > 300)) return false;

        return true;
    }
}
