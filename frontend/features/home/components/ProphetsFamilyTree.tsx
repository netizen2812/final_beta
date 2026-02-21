import React, { useState } from 'react';
import { PROPHETS_DATA, ProphetNode } from '../data/mockData';
import { X } from 'lucide-react';

const ProphetsFamilyTree: React.FC = () => {
    const [selectedProphet, setSelectedProphet] = useState<ProphetNode | null>(null);

    return (
        <section className="relative w-full bg-white/5 backdrop-blur-sm rounded-[4rem] border border-emerald-50/10 py-32 px-4 shadow-2xl reveal-on-scroll">
            {/* Title Overlay */}
            <div className="text-center space-y-4 mb-20 pointer-events-none">
                <div className="w-12 h-1 bg-emerald-100 mx-auto rounded-full" />
                <h2 className="text-4xl md:text-6xl font-serif text-emerald-950">Prophets Lineage</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-900/30">A chronological spiritual journey</p>
            </div>

            {/* The Map Canvas - Now full height and natural scroll */}
            <div className="w-full relative flex justify-center">
                <div className="relative w-full max-w-[1000px] h-[2100px]">
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
                                        stroke="url(#lineGrad)"
                                        strokeWidth="2"
                                        fill="none"
                                        className="animate-[dash_10s_linear_infinite]"
                                        style={{ strokeDasharray: '10, 5' }}
                                    />
                                );
                            })
                        ))}
                    </svg>

                    {PROPHETS_DATA.map(prophet => (
                        <div
                            key={prophet.id}
                            onClick={() => setSelectedProphet(prophet)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 group/node cursor-pointer transition-all duration-500 reveal-on-scroll`}
                            style={{ left: prophet.x, top: prophet.y }}
                        >
                            {/* Outer Glow */}
                            <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity animate-pulse`} />

                            {/* Node Circle */}
                            <div className={`w-28 h-28 rounded-full bg-[#0D4433] border-2 border-emerald-900/20 flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:border-emerald-400 transition-all duration-500`}>
                                <div className="text-center px-3">
                                    <div className="text-[7px] font-black tracking-widest text-emerald-400 uppercase mb-1">Prophet</div>
                                    <div className="text-[11px] font-serif font-bold text-white leading-tight">{prophet.name}</div>
                                </div>
                            </div>

                            {/* Label */}
                            <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <span className="bg-emerald-400 text-[#0D4433] text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Explore Life</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panel Overlay - Fixed to screen for focus */}
            {selectedProphet && (
                <div className="fixed inset-0 z-[100] bg-[#0D4433]/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
                    <div className="w-full max-w-2xl h-full max-h-[90vh] bg-[#FDFCF8] rounded-[3rem] shadow-2xl overflow-y-auto p-12 lg:p-16 relative animate-in zoom-in-95 duration-500">
                        <button
                            onClick={() => setSelectedProphet(null)}
                            className="absolute top-8 right-8 p-4 hover:bg-emerald-50 rounded-full transition-colors text-emerald-900 z-50"
                        >
                            <X size={24} />
                        </button>

                        <div className="space-y-12 h-full">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Sacred Lineage</span>
                                <h3 className="text-6xl font-serif font-bold text-emerald-950 leading-tight">{selectedProphet.name}</h3>
                                <p className="text-emerald-900/60 font-medium italic text-lg">{selectedProphet.lineage}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 py-10 border-y border-emerald-100">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest">Era of Presence</div>
                                    <div className="text-lg font-bold text-emerald-950">{selectedProphet.timePeriod}</div>
                                </div>
                            </div>

                            <div className="space-y-12">
                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        Divine Trials
                                    </h4>
                                    <div className="flex flex-wrap gap-3">
                                        {selectedProphet.trials?.map((trial, i) => (
                                            <span key={i} className="px-6 py-3 bg-white border border-emerald-50 rounded-2xl text-[11px] font-bold text-emerald-900 shadow-sm">
                                                {trial}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        Prophetic Lessons
                                    </h4>
                                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {selectedProphet.lessons?.map((lesson, i) => (
                                            <li key={i} className="flex items-start gap-4 p-5 bg-emerald-50/30 rounded-3xl text-sm text-emerald-900 font-medium">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                {lesson}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="space-y-6">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950 flex items-center gap-3">
                                        <div className="w-8 h-[1px] bg-emerald-200" />
                                        Quranic References
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedProphet.references?.map((ref, i) => (
                                            <div key={i} className="p-6 bg-[#0D4433] rounded-[2rem] text-[11px] font-black text-emerald-100 tracking-[0.2em] shadow-xl">
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
        </section>
    );
};

export default ProphetsFamilyTree;
