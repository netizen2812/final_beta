import React, { useState, useRef, useEffect } from 'react';
import { PROPHETS_DATA, ProphetNode } from '../data/mockData';
import { X, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

const ProphetsFamilyTree: React.FC = () => {
    const [selectedProphet, setSelectedProphet] = useState<ProphetNode | null>(null);
    const [scale, setScale] = useState(0.8);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Pan logic
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset(prev => ({
            x: prev.x + e.movementX / scale,
            y: prev.y + e.movementY / scale
        }));
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleZoom = (delta: number) => {
        setScale(prev => Math.min(Math.max(0.4, prev + delta), 2));
    };

    const resetView = () => {
        setScale(0.8);
        setOffset({ x: 0, y: 0 });
    };

    useEffect(() => {
        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 1 && isDragging) {
                // Simple drag for mobile
            }
        };
        // Proper pinch-zoom would need more complex logic, keeping it simple for now
    }, [isDragging]);

    return (
        <section className="relative h-[800px] w-full bg-white rounded-[4rem] border border-emerald-50 shadow-2xl overflow-hidden group/tree reveal-on-scroll">
            {/* Title & Controls Overlay */}
            <div className="absolute top-10 left-10 z-30 space-y-2 pointer-events-none">
                <h2 className="text-3xl md:text-4xl font-serif text-emerald-950">Prophets Lineage</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-900/30">An educational immersion</p>
            </div>

            <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-2">
                <button onClick={() => handleZoom(0.1)} className="p-3 bg-white border border-emerald-50 rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors text-emerald-900">
                    <ZoomIn size={20} />
                </button>
                <button onClick={() => handleZoom(-0.1)} className="p-3 bg-white border border-emerald-50 rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors text-emerald-900">
                    <ZoomOut size={20} />
                </button>
                <button onClick={resetView} className="p-3 bg-white border border-emerald-50 rounded-2xl shadow-lg hover:bg-emerald-50 transition-colors text-emerald-900">
                    <Maximize size={20} />
                </button>
            </div>

            {/* The Map Canvas */}
            <div
                ref={containerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`w-full h-full cursor-grab active:cursor-grabbing transition-colors ${isDragging ? 'bg-emerald-50/10' : ''}`}
            >
                <div
                    className="w-full h-full p-40 transition-transform duration-200 ease-out"
                    style={{ transform: `scale(${scale}) translate(${offset.x}px, ${offset.y}px)`, transformOrigin: 'center' }}
                >
                    <svg className="absolute inset-0 w-[2000px] h-[2000px] pointer-events-none overflow-visible">
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
                            className={`absolute -translate-x-1/2 -translate-y-1/2 group/node cursor-pointer transition-all duration-500`}
                            style={{ left: prophet.x, top: prophet.y }}
                        >
                            {/* Outer Glow */}
                            <div className={`absolute inset-0 rounded-full bg-emerald-400 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity animate-pulse`} />

                            {/* Node Circle */}
                            <div className={`w-24 h-24 rounded-full bg-white border-2 border-emerald-100 flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:border-emerald-500 transition-all duration-500`}>
                                <div className="text-center px-2">
                                    <div className="text-[8px] font-black tracking-widest text-emerald-900/40 uppercase mb-1">Prophet</div>
                                    <div className="text-[10px] font-serif font-bold text-emerald-950 truncate w-20">{prophet.name}</div>
                                </div>
                            </div>

                            {/* Label */}
                            <div className={`absolute top-full mt-4 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity`}>
                                <span className="bg-emerald-950 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Explore Life</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info Panel Overlay */}
            {selectedProphet && (
                <div className="absolute inset-0 z-50 bg-[#0D4433]/40 backdrop-blur-md flex items-center justify-end p-6 md:p-12 animate-in fade-in duration-500">
                    <div className="w-full max-w-xl h-full bg-[#FDFCF8] rounded-[3rem] shadow-2xl overflow-y-auto p-12 relative animate-in slide-in-from-right duration-700">
                        <button
                            onClick={() => setSelectedProphet(null)}
                            className="absolute top-8 right-8 p-3 hover:bg-emerald-50 rounded-full transition-colors text-emerald-900"
                        >
                            <X size={24} />
                        </button>

                        <div className="space-y-12">
                            <div className="space-y-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-600">Spiritual Lineage</span>
                                <h3 className="text-5xl font-serif font-bold text-emerald-950">{selectedProphet.name}</h3>
                                <p className="text-emerald-900/60 font-medium italic">{selectedProphet.lineage}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 py-8 border-y border-emerald-100">
                                <div className="space-y-1">
                                    <div className="text-[8px] font-black text-emerald-900/30 uppercase tracking-widest">Time Period</div>
                                    <div className="text-sm font-bold text-emerald-950">{selectedProphet.timePeriod}</div>
                                </div>
                                <div className="space-y-1">
                                    {/* Placeholder for other stats */}
                                </div>
                            </div>

                            <div className="space-y-10">
                                <section className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950">Key Trials</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProphet.trials?.map((trial, i) => (
                                            <span key={i} className="px-4 py-2 bg-white border border-emerald-50 rounded-xl text-[10px] font-bold text-emerald-900">
                                                {trial}
                                            </span>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950">Core Lessons</h4>
                                    <ul className="space-y-2">
                                        {selectedProphet.lessons?.map((lesson, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm text-emerald-900/80 font-medium">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                {lesson}
                                            </li>
                                        ))}
                                    </ul>
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-950">Quranic References</h4>
                                    <div className="space-y-2">
                                        {selectedProphet.references?.map((ref, i) => (
                                            <div key={i} className="p-4 bg-emerald-50/50 rounded-2xl text-[10px] font-black text-emerald-800 tracking-widest">
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
