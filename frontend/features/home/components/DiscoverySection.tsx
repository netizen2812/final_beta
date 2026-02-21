import React from 'react';
import { DISCOVERY_CARDS } from '../data/mockData';
import { Compass } from 'lucide-react';

const DiscoverySection: React.FC = () => {
    return (
        <section className="space-y-16 reveal-on-scroll">
            <div className="flex flex-col items-center text-center space-y-4">
                <Compass size={40} className="text-emerald-100 mb-2" />
                <h2 className="text-3xl md:text-5xl font-serif text-emerald-950">Discovery Journeys</h2>
                <p className="text-xs font-black uppercase tracking-[0.4em] text-emerald-900/40">Curated exploration paths</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {DISCOVERY_CARDS.map((card, i) => (
                    <div
                        key={i}
                        className="group relative h-80 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 hover:-translate-y-2"
                    >
                        {/* Abstract Background Texture */}
                        <div className={`absolute inset-0 bg-gradient-to-br ${card.color} transition-transform duration-[2000ms] group-hover:scale-110`}>
                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')` }} />
                        </div>

                        <div className="relative z-10 p-10 h-full flex flex-col justify-end text-white space-y-4">
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[8px] font-black uppercase tracking-[0.2em] w-fit">
                                {card.tag}
                            </span>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold leading-tight">
                                {card.title}
                            </h3>
                            <p className="text-xs font-medium text-white/70 leading-relaxed max-w-[80%]">
                                {card.desc}
                            </p>

                            <div className="pt-6">
                                <div className="h-px bg-white/20 w-12 transition-all duration-500 group-hover:w-full" />
                            </div>
                        </div>

                        {/* Glass swipe effect */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full -translate-y-full rotate-45 transition-transform duration-1000 group-hover:translate-x-full group-hover:translate-y-full" />
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default DiscoverySection;
