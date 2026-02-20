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

    const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

    // Request location -> setup qibla bearing & declination
    const requestLocation = () => {
        setHasRequestedLocation(true);
        if (!navigator.geolocation) {
            setLocationError("Geolocation not supported by this browser. Switching to manual mode.");
            setFallbackMode('manual');
            return;
        }

        setLocationError(null);

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                const bearing = calculateQiblaBearing(latitude, longitude);
                const dist = calculateDistanceToKaaba(latitude, longitude);

                // Check Sanity
                const isSane = CalibrationManager.verifyQiblaBearing(latitude, longitude, bearing);
                if (!isSane) {
                    console.warn(`Sanity check failed for calculated qibla: ${bearing}° at ${latitude}, ${longitude}`);
                }

                setQiblaBearing(bearing);
                setDistance(dist);

                const decl = getMagneticDeclination(latitude, longitude);
                setMagneticDeclination(decl);
                setLocationError(null);
            },
            (err) => {
                // If the user's browser denies permission (either manually or due to lack of HTTPS on mobile)
                setLocationError(err.code === 1
                    ? "Permission denied. Please enable location or use manual mode."
                    : "Unable to retrieve location. Switching to manual mode.");

                // We default to Makkah's bearing from a generic central location (e.g. London) or just switch to manual mode.
                // It's safer to just set fallbackMode to 'manual' if we don't know where they are.
                setFallbackMode('manual');
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

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
        <div className="fixed inset-0 z-[120] bg-slate-900 text-white flex flex-col overflow-hidden animate-in fade-in duration-500 w-full h-full">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#10b981_0%,_transparent_60%)] opacity-10 pointer-events-none" />

            {/* Header */}
            <header className="p-6 flex items-center justify-between z-10 shrink-0">
                <button onClick={onBack} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <h1 className="text-xl font-serif font-bold tracking-widest text-[#f59e0b]">QIBLA FINDER</h1>
                <button onClick={() => setFallbackMode(prev => prev === 'sensor' ? 'manual' : 'sensor')} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-md">
                    {fallbackMode === 'sensor' ? <MapIcon size={20} className="text-white" /> : <Navigation size={20} className="text-white" />}
                </button>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 z-10 w-full max-w-md mx-auto relative">

                {/* Error States */}
                {(locationError || sensorError) && (
                    <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-center gap-4 text-red-200">
                        <PhoneOff size={24} className="shrink-0" />
                        <p className="text-sm font-medium">{locationError || sensorError}</p>
                    </div>
                )}

                {/* Initial Setup State (needs location) */}
                {!hasRequestedLocation && fallbackMode === 'sensor' && qiblaBearing === null && (
                    <div className="text-center space-y-6 flex-1 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50">
                            <MapIcon size={40} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-serif font-bold">Location Required</h2>
                        <p className="text-slate-400 mb-4 px-6">We need your current location to precisely calculate the direction to the Kaaba.</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={requestLocation} className="px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-full text-white font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform">
                                Enable Location
                            </button>
                            <button onClick={() => setFallbackMode('manual')} className="px-8 py-4 bg-white/5 border border-white/10 rounded-full text-slate-300 font-bold tracking-widest uppercase hover:bg-white/10 transition-colors">
                                Use Manual Mode
                            </button>
                        </div>
                    </div>
                )}

                {/* Start Button if compass permissions needed (iOS 13+) */}
                {fallbackMode === 'sensor' && orientation.eventCount === 0 && hasRequestedLocation && !locationError && !sensorError && qiblaBearing !== null && (
                    <button onClick={requestAccess} className="mb-12 px-8 py-4 bg-gradient-to-r from-[#10b981] to-[#f59e0b] rounded-full text-white font-bold tracking-widest uppercase shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-transform">
                        Calibrate Compass
                    </button>
                )}

                {/* Compass Visualiser (Sensor Mode) or Manual Mode */}
                {(qiblaBearing !== null || fallbackMode === 'manual') && (hasRequestedLocation || fallbackMode === 'manual') && (
                    <div className="flex flex-col items-center justify-center w-full flex-1">
                        {fallbackMode === 'sensor' && qiblaBearing !== null ? (
                            <div className={`relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center transition-all duration-1000 ${isFacingQibla ? 'scale-105 filter drop-shadow-[0_0_40px_rgba(245,158,11,0.5)]' : ''}`}>
                                {/* Outer Ring */}
                                <div className="absolute inset-0 border-[6px] border-white/10 rounded-full shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"></div>
                                <div className="absolute inset-4 border-2 border-emerald-500/20 rounded-full border-dashed"></div>

                                {/* Degrees Ring */}
                                <div className="relative w-full h-full rounded-full flex items-center justify-center transition-transform duration-[400ms] shadow-2xl" style={{ transform: `rotate(${smoothenedRotation}deg)` }}>
                                    {/* Theme: Emerald green -> gold gradient */}
                                    <div className={`w-4 h-[90%] rounded-full transition-all duration-300 relative flex flex-col items-center ${isFacingQibla ? 'bg-gradient-to-t from-[#f59e0b] to-[#10b981] animate-pulse shadow-[0_0_30px_#f59e0b]' : 'bg-gradient-to-t from-white/10 via-[#10b981] to-[#f59e0b] shadow-lg'}`}>
                                        {/* Indicator Triangle at top of needle */}
                                        <div className={`absolute top-[-16px] w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[24px] transition-colors duration-300 ${isFacingQibla ? 'border-b-[#10b981] filter drop-shadow-[0_0_15px_#10b981]' : 'border-b-[#f59e0b] filter drop-shadow-[0_0_10px_#f59e0b]'}`}></div>

                                        {/* Reference dot at bottom of needle */}
                                        <div className="absolute bottom-4 w-2 h-2 rounded-full bg-white/50"></div>
                                    </div>
                                </div>

                                {/* Center Hub */}
                                <div className="absolute w-16 h-16 bg-slate-900 border-4 border-[#10b981] rounded-full z-10 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                                    <div className="w-3 h-3 bg-[#f59e0b] rounded-full shadow-[0_0_10px_#f59e0b]"></div>
                                </div>
                            </div>
                        ) : (
                            /* Fallback Mode (Manual / Numeric) */
                            <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 text-center w-full max-w-sm backdrop-blur-xl shadow-2xl">
                                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/30">
                                    <MapIcon size={36} className="text-[#f59e0b]" />
                                </div>
                                <h2 className="text-2xl font-serif font-bold mb-3 text-white">Manual Mode</h2>
                                <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                                    {qiblaBearing !== null
                                        ? "Use any standard compass app on your phone and point it towards the degree below."
                                        : "Location unavailable. Please check your system settings, or face approximately South/East if you are in North America/Europe."}
                                </p>

                                {qiblaBearing !== null && (
                                    <div className="bg-slate-900/50 rounded-3xl py-8 px-4 border border-white/5 shadow-inner">
                                        <div className="text-[10px] uppercase font-black tracking-[0.3em] text-emerald-500 mb-2">Target Bearing</div>
                                        <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#10b981] to-[#f59e0b] drop-shadow-sm">
                                            {Math.round(qiblaBearing)}°
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status Text Area */}
                        <div className="mt-12 text-center space-y-6 max-w-sm w-full">
                            {isFacingQibla && fallbackMode === 'sensor' && (
                                <div className="bg-[#10b981]/20 border border-[#10b981] text-[#10b981] px-6 py-3 rounded-full font-black uppercase tracking-[0.2em] text-[10px] inline-block shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-in slide-in-from-bottom-2">
                                    You are facing the Qibla ✨
                                </div>
                            )}

                            {needsCalibration && !isFacingQibla && fallbackMode === 'sensor' && (
                                <div className="flex flex-col items-center bg-amber-500/10 border border-amber-500/20 p-5 rounded-[2rem] gap-3 backdrop-blur-md">
                                    <RefreshCcw size={24} className="text-amber-500 animate-spin-slow" />
                                    <div>
                                        <p className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Compass Interference</p>
                                        <p className="text-[10px] text-amber-200/70 font-medium">Move your phone in a figure-8 motion to recalibrate.</p>
                                    </div>
                                </div>
                            )}

                            {qiblaBearing !== null && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors">
                                        <div className="flex justify-center items-center gap-2 mb-2">
                                            <Navigation size={14} className="text-emerald-400" />
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Bearing</div>
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-white">{Math.round(qiblaBearing)}°</div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors">
                                        <div className="flex justify-center items-center gap-2 mb-2">
                                            <MapIcon size={14} className="text-[#f59e0b]" />
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Distance</div>
                                        </div>
                                        <div className="text-2xl font-serif font-bold text-white">{distance !== null ? `${Math.round(distance).toLocaleString()}` : '--'} <span className="text-sm text-slate-400">km</span></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Debug Box (Temporary) */}
                        {debugMode && (
                            <div className="fixed bottom-0 left-0 w-full bg-black/90 font-mono text-[10px] p-3 text-emerald-400 overflow-x-auto z-50 pointer-events-none border-t border-emerald-900">
                                <div className="flex gap-4">
                                    <span>Qibla: {qiblaBearing?.toFixed(1)}</span>
                                    <span>MagH: {orientation.magneticHeading?.toFixed(1)}</span>
                                    <span>Decl: {magneticDeclination?.toFixed(1)}</span>
                                    <span>TrueH: {orientation.trueHeading?.toFixed(1)}</span>
                                    <span>Smth: {smoothenedRotation.toFixed(1)}</span>
                                    <span>Ev: {orientation.eventCount}</span>
                                    <span>Acc: {orientation.accuracy}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QiblaPage;
