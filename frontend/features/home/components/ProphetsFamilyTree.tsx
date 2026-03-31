import React, { useState } from 'react';
import { PROPHETS_DATA, ProphetNode } from '../data/mockData';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ProphetsFamilyTree: React.FC = () => {
    const { t } = useTranslation();
    const [selectedProphet, setSelectedProphet] = useState<ProphetNode | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const getArrayData = (field: 'trials' | 'lessons' | 'references') => {
        if (!selectedProphet) return [];
        const translated = t(`prophets.${selectedProphet.id}.${field}`, { returnObjects: true });
        if (Array.isArray(translated)) return translated;
        return selectedProphet[field] || [];
    };

    React.useEffect(() => {
        // Auto-center on Adam (AS) for mobile on mount
        if (window.innerWidth < 768 && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollLeft = (1000 - container.clientWidth) / 2;
        }
    }, []);

    React.useEffect(() => {
        if (selectedProphet) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [selectedProphet]);

    return (
        <>
        <section className="relative w-full bg-gradient-to-b from-emerald-950 to-[#0D4433] rounded-[3rem] border border-emerald-400/20 py-12 md:py-32 px-4 shadow-[0_20px_50px_rgba(5,46,22,0.3)] reveal-on-scroll overflow-hidden">
                {/* Decorative Pattern Layer */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l5 25 25 5-25 5-5 25-5-25-25-5 25-5z' fill='%2310b981'/%3E%3C/svg%3E")`,
                        backgroundSize: '80px 80px'
                    }}
                />
                {/* Title Overlay */}
                <div className="relative text-center space-y-4 mb-10 md:mb-20 pointer-events-none z-20">
                    <div className="w-12 h-1 bg-emerald-400 mx-auto rounded-full" />
                    <h2 className="text-3xl md:text-7xl font-serif text-white">{t('home.prophets.title')}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400/60 font-sans">{t('home.prophets.subtitle')}</p>
                </div>

                {/* The Map Canvas - Now full height and natural scroll with horizontal overflow on mobile */}
                <div
                    ref={scrollContainerRef}
                    className="w-full relative overflow-x-auto no-scrollbar scroll-smooth"
                >
                    <div className="relative w-[1000px] md:w-full max-w-[1000px] h-[2100px] mx-auto">
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                            <defs>
                                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="rgba(16, 185, 129, 0.2)" />
                                    <stop offset="100%" stopColor="rgba(16, 185, 129, 0.05)" />
                                </linearGradient>
                            </defs>
                            {PROPHETS_DATA.map(prophet => (
                                prophet.connections.map(connId => {
                                    const target = PROPHETS_DATA.find(p => p.id === connId);
                                    if (!target) return null;
                                    // Cubic Bezier for flowing lines
                                    const midX = (prophet.x + target.x) / 2;
                                    return (
                                        <path
                                            key={`${prophet.id}-${connId}`}
                                            d={`M ${prophet.x} ${prophet.y} C ${midX} ${prophet.y}, ${midX} ${target.y}, ${target.x} ${target.y}`}
                                            stroke="rgba(52, 211, 153, 0.4)"
                                            strokeWidth="2.5"
                                            fill="none"
                                            className="animate-[dash_15s_linear_infinite]"
                                            style={{ strokeDasharray: '12, 6' }}
                                        />
                                    );
                                })
                            ))}
                        </svg>

                        {PROPHETS_DATA.map(prophet => (
                            <div
                                key={prophet.id}
                                onClick={() => setSelectedProphet(prophet)}
                                className="absolute -translate-x-1/2 -translate-y-1/2 group/node cursor-pointer transition-all duration-500 hover:z-50"
                                style={{ left: prophet.x, top: prophet.y }}
                            >
                                {/* Outer Glow */}
                                <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity animate-pulse`} />

                                {/* Node Circle */}
                                <div className={`w-28 h-28 rounded-full bg-[#0D4433] border-2 border-emerald-900/20 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-500`}>
                                    <div className="text-center px-3">
                                        <div className="text-[7px] font-black tracking-widest text-emerald-400 uppercase mb-1">{t('home.prophets.nodeProphetLabel')}</div>
                                        <div className="text-[11px] font-serif font-bold text-white leading-tight">{t(`prophets.${prophet.id}.name`, { defaultValue: prophet.name })}</div>
                                    </div>
                                </div>

                                {/* Label */}
                                <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                                    <span className="bg-emerald-400 text-[#0D4433] text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">{t('home.prophets.exploreLife')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </section>

            {/* Info Panel Overlay - Moved outside reveal-on-scroll to fix fixed positioning */}
            {selectedProphet && (
                <div
                    className="fixed inset-0 z-[999] bg-[#0D4433]/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500"
                    onClick={() => setSelectedProphet(null)}
                >
                    <div
                        className="w-full max-w-2xl h-full max-h-[90vh] bg-[#FDFCF8] rounded-[3rem] shadow-2xl overflow-y-auto p-8 md:p-12 lg:p-16 relative animate-in zoom-in-95 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Improved Header / Navigation */}
                        <div className="sticky top-0 right-0 left-0 bg-[#FDFCF8]/90 backdrop-blur pb-6 mb-8 flex justify-between items-center z-50 border-b border-emerald-100/50">
                            <button
                                onClick={() => setSelectedProphet(null)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 rounded-full transition-all text-emerald-900 group"
                            >
                                <div className="p-2 bg-emerald-100 rounded-full group-hover:bg-emerald-200 transition-colors">
                                    <X size={18} />
                                </div>
                                <span className="text-xs font-black uppercase tracking-widest">{t('home.prophets.backToLineage')}</span>
                            </button>
                        </div>

                        <div className="space-y-12">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">{t('home.prophets.sacredLineage')}</span>
                                <h3 className="text-4xl md:text-6xl font-serif font-bold text-emerald-950 leading-tight">{t(`prophets.${selectedProphet.id}.name`, { defaultValue: selectedProphet.name })}</h3>
                                <p className="text-emerald-900/60 font-medium italic text-lg">{t(`prophets.${selectedProphet.id}.lineage`, { defaultValue: selectedProphet.lineage })}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10 border-y border-emerald-100">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest">{t('home.prophets.eraOfPresence')}</div>
                                    <div className="text-lg font-bold text-emerald-950">{t(`prophets.${selectedProphet.id}.timePeriod`, { defaultValue: selectedProphet.timePeriod })}</div>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        {t('home.prophets.divineTrials')}
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {getArrayData('trials').map((trial: string, i: number) => (
                                            <span key={i} className="px-6 py-3 bg-white border border-emerald-50 rounded-2xl text-[11px] font-bold text-emerald-900 shadow-sm">
                                                {trial}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        {t('home.prophets.propheticLessons')}
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {getArrayData('lessons').map((lesson: string, i: number) => (
                                            <li key={i} className="flex items-start gap-4 p-5 bg-emerald-50/30 rounded-3xl text-sm text-emerald-900 font-medium border border-emerald-100/50">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                {lesson}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        {t('home.prophets.quranicReferences')}
                                    </h4>
                                    <div className="space-y-3">
                                        {getArrayData('references').map((ref: string, i: number) => (
                                            <div key={i} className="p-6 bg-[#0D4433] rounded-[2rem] text-[11px] font-black text-emerald-100 tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-transform cursor-default">
                                                {ref}
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes dash {
                    to { stroke-dashoffset: -100; }
                }
            `}</style>
        </>
    );
};

export default ProphetsFamilyTree;
