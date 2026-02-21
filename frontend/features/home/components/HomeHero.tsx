import React, { useEffect, useState } from 'react';
import { DAILY_REFLECTION } from '../data/mockData';
import { Sparkles } from 'lucide-react';

const HomeHero: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center overflow-hidden pt-20 px-6">
            {/* Animated Geometric Background */}
            <div className="absolute inset-0 z-0">
                <div
                    className="absolute inset-0 opacity-[0.03] transition-transform duration-[10000ms] ease-linear repeat-infinite flex items-center justify-center marquee"
                    style={{
                        backgroundImage: `url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')`,
                        backgroundSize: '100px 100px',
                        animation: 'slow-pan 60s linear infinite'
                    }}
                />
                {/* Soft Radial Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/10 to-[#FDFCF8]" />
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(15)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute rounded-full bg-emerald-400 opacity-[0.1] blur-[1px]"
                        style={{
                            width: Math.random() * 4 + 2,
                            height: Math.random() * 4 + 2,
                            top: `${Math.random() * 100}%`,
                            left: `${Math.random() * 100}%`,
                            animation: `subtle-float ${Math.random() * 10 + 5}s ease-in-out infinite`,
                            animationDelay: `${Math.random() * 5}s`
                        }}
                    />
                ))}
            </div>

            <div className={`relative z-10 max-w-4xl w-full text-center space-y-12 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Subtle Branding */}
                <div className="flex flex-col items-center gap-2 mb-8 opacity-20 hover:opacity-100 transition-opacity cursor-default">
                    <img src="/imam_logo.png" alt="IMAM" className="h-10 w-auto grayscale brightness-0" />
                    <span className="text-[10px] font-black tracking-[0.5em] text-[#0D4433]">IMAM</span>
                </div>

                {/* Calligraphy-style Heading */}
                <div className="space-y-4">
                    <div className="text-emerald-900/40 text-4xl md:text-6xl font-serif mb-4 select-none drop-shadow-sm">
                        {DAILY_REFLECTION.calligraphy}
                    </div>
                    <h2 className="text-sm md:text-md font-black tracking-[0.6em] uppercase text-emerald-900/60 drop-shadow-sm">
                        The Path of Enlightenment
                    </h2>
                </div>

                {/* Reflection Card */}
                <div className="group relative bg-white/70 backdrop-blur-xl border border-emerald-100/50 p-10 md:p-16 rounded-[4rem] shadow-[0_30px_100px_-20px_rgba(16,185,129,0.08)] transition-all duration-500 hover:shadow-[0_40px_120px_-20px_rgba(16,185,129,0.12)] hover:-translate-y-2">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#0D4433] text-white p-4 rounded-full shadow-xl">
                        <Sparkles size={20} className="animate-pulse" />
                    </div>

                    <div className="space-y-8">
                        <p className="text-2xl md:text-4xl font-serif text-emerald-950 leading-relaxed italic">
                            "{DAILY_REFLECTION.ayah}"
                        </p>
                        <div className="flex flex-col items-center space-y-2">
                            <div className="w-12 h-px bg-emerald-200" />
                            <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-emerald-700/60">
                                {DAILY_REFLECTION.reference}
                            </p>
                        </div>
                    </div>

                    {/* Subtle light sweep */}
                    <div className="absolute inset-0 rounded-[4rem] overflow-hidden pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full" />
                    </div>
                </div>

                {/* CTA Button */}
                <button
                    onClick={() => {
                        const el = document.getElementById('feature-grid');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="group relative px-12 py-5 bg-[#0D4433] text-white rounded-full font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:shadow-emerald-900/20 hover:-translate-y-1 transition-all"
                >
                    <span className="relative z-10">Begin today's journey</span>
                    <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-0 group-hover:opacity-10 transition-opacity" />
                </button>
            </div>

            <style>{`
        @keyframes slow-pan {
          from { background-position: 0 0; }
          to { background-position: 500px 500px; }
        }
      `}</style>
        </section>
    );
};

export default HomeHero;
