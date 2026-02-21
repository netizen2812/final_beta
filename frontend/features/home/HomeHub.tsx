import React, { useState, useEffect } from 'react';
import HomeHero from './components/HomeHero';
import FeatureCardsGrid from './components/FeatureCardsGrid';
import ProphetsFamilyTree from './components/ProphetsFamilyTree';
import HomeFooter from './components/HomeFooter';
import { AppTab } from '../../types';

interface HomeHubProps {
    onNavigate: (tab: AppTab) => void;
}

const HomeHub: React.FC<HomeHubProps> = ({ onNavigate }) => {
    const [scrolled, setScrolled] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="relative min-h-screen bg-[#FDFCF8] overflow-hidden selection:bg-emerald-100 selection:text-emerald-900">
            {/* Background ambient lighting */}
            <div
                className="fixed inset-0 pointer-events-none transition-opacity duration-1000"
                style={{
                    background: `radial-gradient(circle at 50% ${Math.max(0, 50 - scrolled * 0.05)}%, rgba(16, 185, 129, 0.03) 0%, transparent 70%)`
                }}
            />

            <div className="relative z-10">
                <HomeHero />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32 py-20 md:py-32">
                    <FeatureCardsGrid onNavigate={onNavigate} />

                    <ProphetsFamilyTree />
                </div>

                <HomeFooter />
            </div>

            {/* Global CSS for animations */}
            <style>{`
        @keyframes subtle-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes sweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes text-reveal {
          from { opacity: 0; filter: blur(10px); }
          to { opacity: 1; filter: blur(0); }
        }
        .reveal-on-scroll {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .reveal-on-scroll.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
        </div>
    );
};

export default HomeHub;
