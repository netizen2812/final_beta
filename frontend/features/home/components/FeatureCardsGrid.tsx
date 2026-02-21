import React from 'react';
import { AppTab } from '../../../types';
import {
    MessageSquare,
    Compass,
    Feather,
    Sparkle,
    Target
} from 'lucide-react';

interface FeatureCardProps {
    title: string;
    desc: string;
    benefit: string;
    icon: any;
    image: string;
    onClick: () => void;
    variant?: 'light' | 'dark';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, desc, benefit, icon: Icon, image, onClick, variant = 'light' }) => {
    return (
        <div
            onClick={onClick}
            className={`group relative p-12 rounded-[4rem] border transition-all duration-700 cursor-pointer overflow-hidden flex flex-col items-center text-center h-[500px] reveal-on-scroll bg-[#0D4433] border-white/10 shadow-3xl`}
        >
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110"
                style={{
                    backgroundImage: `url(${image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: 0.3
                }}
            />

            {/* Content Reveal Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Icon & Content Container */}
            <div className="mt-auto space-y-6 relative z-20 w-full flex flex-col items-center">
                <div className="space-y-3 transform transition-all duration-700 translate-y-8 group-hover:translate-y-0 h-32 flex flex-col justify-end">
                    <h3 className="text-3xl font-black text-white px-2">
                        {title}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed max-w-[280px] opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 text-emerald-100/70">
                        {desc}
                    </p>
                </div>

                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-200 transform translate-y-4 group-hover:translate-y-0">
                    <div className="h-[1px] w-8 bg-emerald-400/50" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
                        {benefit}
                    </span>
                    <div className="h-[1px] w-8 bg-emerald-400/50" />
                </div>
            </div>

            {/* Creative Organic Icon Overlay */}
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex items-center justify-center">
                <div className="relative">
                    {/* Glowing Auras */}
                    <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                    <div className="absolute inset-[-20%] border border-emerald-400/20 rounded-full group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute inset-[-40%] border border-emerald-400/10 rounded-full group-hover:scale-125 transition-transform duration-1000 delay-75" />

                    {/* The Icon */}
                    <div className="relative p-6 rounded-full bg-white/5 backdrop-blur-md border border-white/20 text-white transform transition-all duration-700 group-hover:scale-110 group-hover:shadow-[0_0_50px_-10px_rgba(52,211,153,0.5)]">
                        <Icon
                            size={32}
                            className={`transition-transform duration-1000 ${title === "Ibadah Tools" ? 'group-hover:rotate-[360deg]' :
                                title === "Tarbiyah Learning" ? 'group-hover:-rotate-12 group-hover:translate-x-1' : ''
                                }`}
                        />
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
    const features = [
        {
            title: "AI Imam Guidance",
            desc: "Engage in deep spiritual dialogue with our advanced AI trained on classical wisdom.",
            benefit: "personalized clarity",
            icon: MessageSquare,
            image: "/images/ai_imam.png",
            tab: AppTab.CORE,
            variant: 'dark' as const
        },
        {
            title: "Tarbiyah Learning",
            desc: "Structured paths for children and adults to grow foundationally in faith.",
            benefit: "structured growth",
            icon: Feather,
            image: "/images/tarbiyah.png",
            tab: AppTab.TARBIYAH
        },
        {
            title: "Ibadah Tools",
            desc: "Every tool you need for your daily worship, from Quran to Zakat calculations.",
            benefit: "worship support",
            icon: Compass,
            image: "/images/ibadah_new.png",
            tab: AppTab.IBADAH
        }
    ];

    /* REMOVED LIVE AND SCHOLAR CARDS */



    return (
        <section id="feature-grid" className="space-y-16 py-20 min-h-[600px]">
            <div className="flex flex-col items-center text-center space-y-4 reveal-on-scroll">
                <div className="w-12 h-1 bg-emerald-100 rounded-full" />
                <h2 className="text-3xl md:text-5xl font-serif text-emerald-950">Primary Exploration</h2>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40">Choose your destination</p>
            </div>

            {/* Desktop Grid / Mobile Scroll */}
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10 flex overflow-x-auto md:overflow-visible no-scrollbar snap-x snap-mandatory px-4 -mx-4 scroll-px-4">
                {features.map((feature, i) => (
                    <div
                        key={i}
                        className="reveal-on-scroll min-w-[85vw] md:min-w-0 snap-center"
                        style={{ transitionDelay: `${i * 150}ms` }}
                    >
                        <FeatureCard
                            {...feature}
                            onClick={() => onNavigate(feature.tab)}
                        />
                    </div>
                ))}
            </div>
        </section>
    );
};

export default FeatureCardsGrid;
