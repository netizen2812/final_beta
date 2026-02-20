import React, { useState, useEffect, useRef } from 'react';
import { calculateQiblaBearing, calculateDistanceToKaaba } from '../../src/services/qibla/QiblaBearingService';
import { getMagneticDeclination } from '../../src/services/qibla/MagneticDeclinationService';
import { deviceOrientationService, OrientationData } from '../../src/services/qibla/DeviceOrientationService';
import { CalibrationManager } from '../../src/services/qibla/CalibrationManager';
import { Compass, RefreshCcw, Navigation, Map as MapIcon, Info, PhoneOff } from 'lucide-react';

interface QiblaPageProps {
    onBack: () => void;
}

const QiblaPage: React.FC<QiblaPageProps> = ({ onBack }) => {
    // State
    const [qiblaBearing, setQiblaBearing] = useState<number | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [magneticDeclination, setMagneticDeclination] = useState<number | null>(null);
    const [orientation, setOrientation] = useState<OrientationData>({
        magneticHeading: null,
        trueHeading: null,
        accuracy: null,
        isAbsolute: false,
        eventCount: 0
    });

    const [smoothenedRotation, setSmoothenedRotation] = useState<number>(0);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [sensorError, setSensorError] = useState<string | null>(null);
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [debugMode, setDebugMode] = useState(true); // Temporarily true for evaluation
    const [fallbackMode, setFallbackMode] = useState<'sensor' | 'manual'>('sensor');

    // Request location -> setup qibla bearing & declination
    useEffect(() => {
        if (!navigator.geolocation) {
            setLocationError("Geolocation not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const bearing = calculateQiblaBearing(latitude, longitude);
                const dist = calculateDistanceToKaaba(latitude, longitude);

                // Check Sanity
                const isSane = CalibrationManager.verifyQiblaBearing(latitude, longitude, bearing);
                if (!isSane) {
                    console.warn(`Sanity check failed for calculated qibla: ${bearing}° at ${latitude}, ${longitude}`);
                    // Proceed anyway, but something might be wrong with coordinates format
                }

                setQiblaBearing(bearing);
                setDistance(dist);

                const decl = getMagneticDeclination(latitude, longitude);
                setMagneticDeclination(decl);
            },
            (err) => setLocationError("Please enable location services to find the Qibla.")
        );
    }, []);

    // Handle Sensor Updates
    useEffect(() => {
        if (fallbackMode !== 'sensor') return;

        const handleOrientationCallback = (data: OrientationData) => {
            setOrientation(data);

            if (data.magneticHeading === null && data.eventCount > 5) {
                setSensorError("Sensors unavailable or not absolute. Please try moving your phone.");
            } else {
                setSensorError(null);
            }
        };

        const unsubscribe = deviceOrientationService.subscribe(handleOrientationCallback);
        deviceOrientationService.startListening();

        return () => {
            unsubscribe();
            deviceOrientationService.stopListening();
        };
    }, [fallbackMode]);

    // Handle Rotation Physics (EMA Smoothing)
    useEffect(() => {
        if (qiblaBearing === null || orientation.magneticHeading === null || magneticDeclination === null) return;

        // trueHeading = magneticHeading + declination
        const computedTrueHeading = orientation.trueHeading !== null
            ? orientation.trueHeading
            : (orientation.magneticHeading + magneticDeclination + 360) % 360;

        // rotation = qibla bearing relative to current phone heading
        const rawRotation = (qiblaBearing - computedTrueHeading + 360) % 360;

        setSmoothenedRotation(prev => deviceOrientationService.getSmoothedAngle(rawRotation, prev));

    }, [qiblaBearing, orientation, magneticDeclination]);

    // Request Compass Access
    const requestAccess = async () => {
        const granted = await deviceOrientationService.requestPermission();
        if (!granted) {
            setSensorError("Permission denied for compass. Switching to manual mode.");
            setFallbackMode('manual');
        }
    };

    // UI Calculation state
    const isFacingQibla = Math.abs(smoothenedRotation) < 5 || Math.abs(smoothenedRotation) > 355;
    const needsCalibration = CalibrationManager.needsCalibration(orientation.accuracy);

    // Vibration feedback when perfectly aligned
    useEffect(() => {
        if (isFacingQibla && navigator.vibrate && fallbackMode === 'sensor') {
            navigator.vibrate([50, 50, 50]);
        }
    }, [isFacingQibla, fallbackMode]);

    // Stop logs after stable connection automatically (Debug cleanup)
    useEffect(() => {
        if (orientation.eventCount > 100 && debugMode) {
            setDebugMode(false);
            console.log("Qibla log stabilized and disabled.");
        }
    }, [orientation.eventCount, debugMode]);


    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col relative overflow-hidden animate-in fade-in duration-500">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b981_0%,_transparent_60%)] opacity-10" />

            {/* Header */}
            <header className="p-6 flex items-center justify-between z-10 relative">
                <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-serif font-bold tracking-widest text-[#f59e0b]">QIBLA FINDER</h1>
                <button onClick={() => setFallbackMode(prev => prev === 'sensor' ? 'manual' : 'sensor')} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                    {fallbackMode === 'sensor' ? <MapIcon size={20} className="text-white" /> : <Navigation size={20} className="text-white" />}
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 relative mt-[-10vh]">

                {/* Error States */}
                {(locationError || sensorError) && (
                    <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center gap-4 text-red-200">
                        <PhoneOff size={24} />
                        <p className="text-sm font-medium">{locationError || sensorError}</p>
                    </div>
                )}

                {/* Start Button if permissions needed (iOS 13+) */}
                {fallbackMode === 'sensor' && orientation.eventCount === 0 && !locationError && !sensorError && (
                    <button onClick={requestAccess} className="mb-12 px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-full text-white font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform">
                        Calibrate Compass
                    </button>
                )}

                {/* Compass Visualiser (Sensor Mode) */}
                {fallbackMode === 'sensor' ? (
                    <div className={`relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center transition-all duration-1000 ${isFacingQibla ? 'scale-105 filter drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]' : ''}`}>
                        {/* Outer Ring */}
                        <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>

                        {/* Degrees Ring (Rotated based on device heading vs true north if we wanted a traditional compass layout. But here we rotate the needle towards qibla) */}
                        <div className="relative w-full h-full rounded-full flex items-center justify-center transition-transform duration-[400ms]" style={{ transform: `rotate(${smoothenedRotation}deg)` }}>
                            {/* Theme: Emerald green -> gold gradient */}
                            <div className={`w-3 h-full rounded-full transition-all duration-300 ${isFacingQibla ? 'bg-gradient-to-t from-[#f59e0b] to-[#10b981] animate-pulse shadow-[0_0_20px_#f59e0b]' : 'bg-gradient-to-t from-white/10 via-[#10b981] to-[#f59e0b]'}`}></div>

                            {/* Indicator Triangle at top of needle */}
                            <div className="absolute top-[-10px] w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-b-[20px] transition-colors duration-300 border-b-[#f59e0b] shadow-[0_0_10px_#f59e0b]"></div>
                        </div>

                        {/* Center Hub */}
                        <div className="absolute w-12 h-12 bg-slate-900 border-4 border-[#10b981] rounded-full z-10 flex items-center justify-center">
                            <div className="w-2 h-2 bg-[#f59e0b] rounded-full"></div>
                        </div>
                    </div>
                ) : (
                    /* Fallback Mode (Manual / Numeric) */
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center w-full max-w-sm backdrop-blur-md">
                        <MapIcon size={48} className="mx-auto text-[#f59e0b] mb-6" />
                        <h2 className="text-xl font-bold mb-2">Manual Direction</h2>
                        <p className="text-slate-400 text-sm mb-6">Use any standard compass app on your phone and point it towards the below degree.</p>
                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#10b981] to-[#f59e0b]">
                            {qiblaBearing ? Math.round(qiblaBearing) : '--'}°
                        </div>
                    </div>
                )}

                {/* Status Text Area */}
                <div className="mt-16 text-center space-y-4 max-w-sm w-full">
                    {isFacingQibla && fallbackMode === 'sensor' && (
                        <div className="bg-[#f59e0b]/20 border border-[#f59e0b] text-[#f59e0b] px-4 py-2 rounded-full font-bold uppercase tracking-widest text-xs inline-block animate-bounce shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            Directly Aligned ✨
                        </div>
                    )}

                    {needsCalibration && !isFacingQibla && fallbackMode === 'sensor' && (
                        <div className="flex flex-col items-center bg-white/5 border border-white/10 p-4 rounded-2xl gap-3">
                            <RefreshCcw size={20} className="text-amber-500 animate-spin-slow" />
                            <p className="text-xs font-semibold text-slate-300">Magnetic Interference Detected</p>
                            <p className="text-[10px] text-slate-400">Move your phone in a figure-8 motion to recalibrate the compass.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Target Bearing</div>
                            <div className="text-xl font-bold text-white">{qiblaBearing !== null ? `${Math.round(qiblaBearing)}°` : '--'}</div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm">
                            <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Distance</div>
                            <div className="text-xl font-bold text-white">{distance !== null ? `${Math.round(distance)} km` : '--'}</div>
                        </div>
                    </div>
                </div>

                {/* Debug Box (Temporary) */}
                {debugMode && (
                    <div className="fixed bottom-0 left-0 w-full bg-black/80 font-mono text-[9px] p-2 text-green-400 overflow-x-auto z-50 pointer-events-none">
                        qibla: {qiblaBearing?.toFixed(1)} | magH: {orientation.magneticHeading?.toFixed(1)} | decl: {magneticDeclination?.toFixed(1)} |
                        trueH: {orientation.trueHeading?.toFixed(1)} | smthRot: {smoothenedRotation.toFixed(1)} | ev: {orientation.eventCount} |
                        acc: {orientation.accuracy}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QiblaPage;
