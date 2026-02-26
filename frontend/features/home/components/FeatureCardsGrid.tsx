import React, { useState, useEffect } from 'react';
import { AppTab } from '../../../types';
import {
    MessageSquare,
    Compass,
    Feather,
    Sparkle,
    Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface FeatureCardProps {
    title: string;
    desc: string;
    benefit: string;
    icon: any;
    image: string;
    onClick: () => void;
    isFlipped: boolean;
    onFlip: (e: React.MouseEvent) => void;
    variant?: 'light' | 'dark';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, desc, benefit, icon: Icon, image, onClick, isFlipped, onFlip }) => {
    const { t } = useTranslation();

    return (
        <div
            onClick={onFlip}
            className="relative cursor-pointer h-[420px] md:h-[500px] w-full [perspective:1000px] reveal-on-scroll"
        >
            <div
                className={`relative w-full h-full transition-transform duration-[400ms] ease-in-out [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}
            >
                {/* FRONT SIDE */}
                <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] bg-[#0D4433] rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col items-center text-center p-12">
                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `url(${image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            opacity: 0.3
                        }}
                    />

                    {/* Creative Organic Icon Overlay */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                        <div className="relative">
                            {/* Glowing Auras */}
                            <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20" />
                            <div className="absolute inset-[-20%] border border-emerald-400/20 rounded-full" />
                            <div className="absolute inset-[-40%] border border-emerald-400/10 rounded-full" />

                            {/* The Icon */}
                            <div className="relative p-6 rounded-full bg-white/5 backdrop-blur-md border border-white/20 text-white shadow-lg">
                                <Icon size={32} />
                            </div>
                        </div>
                    </div>

                    {/* Title Container */}
                    <div className="mt-auto relative z-20 w-full flex flex-col items-center">
                        <div className="h-32 flex flex-col justify-end pb-8">
                            <h3 className="text-3xl font-black text-white px-2">
                                {title}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* BACK SIDE */}
                <div className="absolute inset-0 [backface-visibility:hidden] [-webkit-backface-visibility:hidden] [transform:rotateY(180deg)] bg-[#0D4433] rounded-[4rem] border border-white/10 shadow-3xl overflow-hidden flex flex-col items-center justify-center text-center p-8">
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/80 to-emerald-900/50" />

                    <div className="relative z-20 space-y-6 w-full flex flex-col items-center">
                        <h3 className="text-2xl font-black text-white px-2">
                            {title}
                        </h3>
                        <p className="text-sm font-medium leading-relaxed max-w-[280px] text-emerald-100/80">
                            {desc}
                        </p>

                        <div className="flex items-center gap-4 py-2">
                            <div className="h-[1px] w-8 bg-emerald-400/50" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                                {benefit}
                            </span>
                            <div className="h-[1px] w-8 bg-emerald-400/50" />
                        </div>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick();
                            }}
                            className="mt-6 px-10 py-3.5 bg-emerald-400 hover:bg-emerald-300 text-emerald-950 rounded-full font-black uppercase tracking-widest text-xs transition-colors shadow-lg active:scale-95 touch-manipulation"
                        >
                            {t('common.open', { defaultValue: 'Open' })}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface FeatureCardsGridProps {
    onNavigate: (tab: AppTab) => void;
}

const FeatureCardsGrid: React.FC<FeatureCardsGridProps> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleClickOutside = () => setFlippedIndex(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const features = [
        {
            title: t('home.aiImamGuidance'),
            desc: t('home.aiImamDesc'),
            benefit: t('home.personalizedClarity'),
            icon: MessageSquare,
            image: "/images/ai_imam.png",
            tab: AppTab.CORE,
            variant: 'dark' as const
        },
        {
            title: t('home.tarbiyahLearning'),
            desc: t('home.tarbiyahDesc'),
            benefit: t('home.structuredGrowth'),
            icon: Feather,
            image: "/images/tarbiyah.png",
            tab: AppTab.TARBIYAH
        },
        {
            title: t('home.ibadahTools'),
            desc: t('home.ibadahDesc'),
            benefit: t('home.worshipSupport'),
            icon: Compass,
            image: "/images/ibadah_new.png",
            tab: AppTab.IBADAH
        }
    ];

    return (
        <section id="feature-grid" className="space-y-16 py-20 min-h-[600px]">
            <div className="flex flex-col items-center text-center space-y-4 reveal-on-scroll">
                <div className="w-12 h-1 bg-emerald-100 rounded-full" />
                <h2 className="text-3xl md:text-5xl font-serif text-emerald-950">{t('home.primaryExploration')}</h2>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40">{t('home.chooseDestination')}</p>
            </div>

            {/* Desktop Grid / Mobile Scroll */}
            <div
                className="md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 flex overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory px-4 -mx-4 scroll-px-4"
                onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / (window.innerWidth * 0.85));
                    const dots = document.querySelectorAll('.scroll-dot');
                    dots.forEach((dot, i) => {
                        (dot as HTMLElement).style.opacity = i === index ? '1' : '0.3';
                        (dot as HTMLElement).style.width = i === index ? '24px' : '8px';
                    });
                }}
            >
                {features.map((feature, i) => (
                    <div
                        key={i}
                        className="reveal-on-scroll min-w-[75vw] md:min-w-0 snap-center"
                        style={{ transitionDelay: `${i * 150}ms` }}
                    >
                        <FeatureCard
                            {...feature}
                            isFlipped={flippedIndex === i}
                            onFlip={(e) => {
                                e.stopPropagation();
                                setFlippedIndex(flippedIndex === i ? null : i);
                            }}
                            onClick={() => onNavigate(feature.tab)}
                        />
                    </div>
                ))}
            </div>

            {/* Mobile Scroll Indicator Dots */}
            <div className="flex md:hidden justify-center items-center gap-2 mt-4">
                {features.map((_, i) => (
                    <div
                        key={i}
                        className={`scroll-dot h-1.5 rounded-full bg-emerald-950 transition-all duration-300 ${i === 0 ? 'w-6 opacity-100' : 'w-2 opacity-30'}`}
                    />
                ))}
            </div>
        </section>
    );
};

export default FeatureCardsGrid;
