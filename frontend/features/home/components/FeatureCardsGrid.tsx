import React from 'react';
import { AppTab } from '../../../types';
import {
    MessageSquare,
    Target,
    BarChart3,
    Sparkle,
    Radio
} from 'lucide-react';

interface FeatureCardProps {
    title: string;
    desc: string;
    benefit: string;
    icon: any;
    onClick: () => void;
    variant?: 'light' | 'dark';
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, desc, benefit, icon: Icon, onClick, variant = 'light' }) => {
    return (
        <div
            onClick={onClick}
            className={`group relative p-10 rounded-[3rem] border transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full min-h-[300px] reveal-on-scroll ${variant === 'dark'
                ? 'bg-[#0D4433] border-white/10 shadow-2xl hover:-translate-y-2'
                : 'bg-white border-emerald-50 shadow-[0_15px_60px_-15px_rgba(0,0,0,0.04)] hover:shadow-[0_25px_80px_-15px_rgba(0,0,0,0.08)] hover:border-emerald-200 hover:-translate-y-2'
                }`}
        >
            {/* Background sweep */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Icon */}
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-10 transition-all duration-500 ${variant === 'dark'
                ? 'bg-white/10 text-white shadow-xl'
                : 'bg-[#FDFCF8] text-[#0D4433] shadow-inner group-hover:bg-[#0D4433] group-hover:text-white'
                }`}>
                <Icon size={32} />
            </div>

            <div className="space-y-4 relative z-10">
                <h3 className={`text-2xl font-black transition-colors ${variant === 'dark' ? 'text-white' : 'text-emerald-950'}`}>
                    {title}
                </h3>

                {/* Revealable content */}
                <div className="space-y-4 transition-all duration-500 opacity-60 group-hover:opacity-100">
                    <p className={`text-sm font-medium leading-relaxed ${variant === 'dark' ? 'text-emerald-100/70' : 'text-gray-500'}`}>
                        {desc}
                    </p>
                    <div className="pt-4 border-t border-current opacity-10" />
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] transform transition-all duration-500 translate-y-2 group-hover:translate-y-0 ${variant === 'dark' ? 'text-emerald-300' : 'text-emerald-600'}`}>
                        {benefit}
                    </p>
                </div>
            </div>

            {/* Action Button */}
            <div className="mt-auto pt-8">
                <button className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${variant === 'dark' ? 'bg-white text-[#0D4433]' : 'bg-[#0D4433] text-white'
                    }`}>
                    Enter
                </button>
            </div>

            {/* Corner floating icon */}
            <div className={`absolute top-6 right-6 opacity-[0.05] transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-12 ${variant === 'dark' ? 'text-white' : 'text-emerald-900'}`}>
                <Icon size={120} />
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
            tab: AppTab.CORE,
            variant: 'dark' as const
        },
        {
            title: "Tarbiyah Learning",
            desc: "Structured paths for children and adults to grow foundationally in faith.",
            benefit: "structured growth",
            icon: Sparkle,
            tab: AppTab.TARBIYAH
        },
        {
            title: "Ibadah Tools",
            desc: "Every tool you need for your daily worship, from Quran to Zakat calculations.",
            benefit: "worship support",
            icon: Target,
            tab: AppTab.IBADAH
        }
    ];

    /* REMOVED LIVE AND SCHOLAR CARDS */

    React.useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.reveal-on-scroll').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    return (
        <section id="feature-grid" className="space-y-16 py-20">
            <div className="flex flex-col items-center text-center space-y-4 reveal-on-scroll">
                <div className="w-12 h-1 bg-emerald-100 rounded-full" />
                <h2 className="text-3xl md:text-5xl font-serif text-emerald-950">Primary Exploration</h2>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40">Choose your destination</p>
            </div>

            {/* Scrollable Container for Mobile, Grid for Desktop */}
            <div className="flex overflow-x-auto pb-10 gap-6 snap-x lg:grid lg:grid-cols-3 lg:gap-8 lg:overflow-visible lg:pb-0 scrollbar-hide">
                {features.map((feature, i) => (
                    <div
                        key={i}
                        style={{ transitionDelay: `${i * 100}ms` }}
                        className="flex-shrink-0 w-[85%] sm:w-[60%] snap-center h-full lg:w-full"
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
