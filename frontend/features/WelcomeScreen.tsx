import React, { useState, useRef, useEffect } from 'react';

interface WelcomeScreenProps {
    onComplete: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onComplete }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [showText, setShowText] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => {
            // Trigger text at 4 seconds
            if (video.currentTime >= 4 && !showText) {
                setShowText(true);
            }
        };

        const handleEnded = () => {
            // Smoothly transition out
            setTimeout(() => {
                onComplete();
            }, 500); // Short buffer after video ends
        };

        const handleError = () => {
            console.error("Video failed to play/load");
            setHasError(true);
            // Fallback: show text immediately if video fails
            setShowText(true);
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
        };
    }, [showText, onComplete]);

    // Attempt autoplay
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(err => {
                console.log("Autoplay blocked, showing fallback play button", err);
            });
        }
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">

            {/* 📹 VIDEO BACKGROUND */}
            {!hasError && (
                <video
                    ref={videoRef}
                    className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity duration-1000"
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={() => setIsVideoLoaded(true)}
                >
                    <source src="/welcome.mp4" type="video/mp4" />
                </video>
            )}

            {/* 🌑 OVERLAY GRADIENT (Optional for readability) */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* ✨ TEXT OVERLAY (Centered) */}
            <div
                className={`relative z-10 flex flex-col items-center justify-center text-center px-4 transition-all duration-[900ms] ease-out transform ${showText ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                    }`}
            >
                <h1
                    className="text-white font-serif font-medium tracking-tight"
                    style={{
                        fontSize: 'clamp(2rem, 5vw + 1rem, 5rem)', // Fluid typography
                        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
                    }}
                >
                    Welcome to IMAM
                </h1>
            </div>

            {/* SKIP / FALLBACK BUTTON */}
            <button
                onClick={onComplete}
                className="absolute bottom-10 right-10 text-white/40 hover:text-white border border-white/10 hover:border-white/30 px-6 py-2 rounded-full text-xs uppercase tracking-widest backdrop-blur-md transition-all z-20"
            >
                {hasError ? "Enter App" : "Skip"}
            </button>

            {/* Loading Fallback */}
            {!isVideoLoaded && !hasError && (
                <div className="absolute inset-0 bg-black flex items-center justify-center -z-10">
                    {/* Static background if needed, currently just black */}
                </div>
            )}
        </div>
    );
};

export default WelcomeScreen;
