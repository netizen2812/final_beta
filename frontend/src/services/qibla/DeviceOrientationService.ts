/**
 * Service to handle device orientation securely and consistently across iOS and Android.
 */

export interface OrientationData {
    magneticHeading: number | null;
    trueHeading: number | null;
    accuracy: number | null;
    isAbsolute: boolean;
    eventCount: number; // useful to detect frozen sensors
}

type OrientationCallback = (data: OrientationData) => void;

class DeviceOrientationService {
    private listeners: Set<OrientationCallback> = new Set();
    private isListening: boolean = false;
    private lastData: OrientationData = {
        magneticHeading: null,
        trueHeading: null,
        accuracy: null,
        isAbsolute: false,
        eventCount: 0,
    };

    /**
     * Request permission (required for iOS 13+).
     * Must be called in response to a user gesture (e.g., button click).
     */
    async requestPermission(): Promise<boolean> {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permissionState = await (DeviceOrientationEvent as any).requestPermission();
                return permissionState === 'granted';
            } catch (error) {
                console.error("Error requesting DeviceOrientation permission:", error);
                return false;
            }
        }
        // Android and older iOS devices don't require explicit permissions via this API
        return true;
    }

    public startListening() {
        if (this.isListening) return;

        // Add both standard event and absolute event for better Android support
        window.addEventListener('deviceorientationabsolute', this.handleOrientation.bind(this), true);

        // Fallback standard event (essential for iOS which uses this to pass webkitCompassHeading)
        window.addEventListener('deviceorientation', this.handleOrientation.bind(this), true);

        this.isListening = true;
    }

    public stopListening() {
        if (!this.isListening) return;
        window.removeEventListener('deviceorientationabsolute', this.handleOrientation.bind(this), true);
        window.removeEventListener('deviceorientation', this.handleOrientation.bind(this), true);
        this.isListening = false;
    }

    public subscribe(callback: OrientationCallback) {
        this.listeners.add(callback);
        // Immediately emit last known data to new subscriber
        callback(this.lastData);

        return () => {
            this.listeners.delete(callback);
        };
    }

    private handleOrientation = (event: DeviceOrientationEvent) => {
        let magneticHeading: number | null = null;
        let trueHeading: number | null = null;
        let accuracy: number | null = null;
        let isAbsolute = event.absolute;

        // iOS WebKit specific properties
        const ev = event as any;
        if (ev.webkitCompassHeading !== undefined) {
            magneticHeading = ev.webkitCompassHeading;
            trueHeading = ev.webkitCompassHeading; // iOS pre-applies true heading sometimes, but we prefer manual magnetic + declination. We expose magnetic.
            accuracy = ev.webkitCompassAccuracy;
            isAbsolute = true;
        }
        // Android standard properties
        else if (event.alpha !== null && isAbsolute) {
            // Chrome Android puts heading relative to absolute north in `alpha` (inverted)
            // `alpha` is 0 at north, and increases counter-clockwise. Heading increases clockwise.
            magneticHeading = 360 - event.alpha;
            accuracy = 15; // Assumption for Android without accuracy metric
        }

        if (magneticHeading !== null) {
            this.lastData = {
                magneticHeading: (magneticHeading + 360) % 360,
                trueHeading: trueHeading !== null ? (trueHeading + 360) % 360 : null,
                accuracy,
                isAbsolute: isAbsolute === true,
                eventCount: this.lastData.eventCount + 1
            };

            this.listeners.forEach(listener => listener(this.lastData));
        }
    }

    /**
     * Utility to smooth rotation to prevent jitter using Exponential Moving Average (EMA).
     * Works with angles to prevent the 359 -> 0 flip issue.
     */
    public getSmoothedAngle(currentRaw: number, previousSmoothed: number, alpha: number = 0.15): number {
        // Handle the wrapping around 360 degrees
        let diff = currentRaw - previousSmoothed;

        // Shortest path
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        let smoothed = previousSmoothed + alpha * diff;
        return (smoothed + 360) % 360;
    }
}

export const deviceOrientationService = new DeviceOrientationService();
