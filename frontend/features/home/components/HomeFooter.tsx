import React from 'react';

const HomeFooter: React.FC = () => {
    return (
        <footer className="mt-40 border-t border-emerald-50 bg-white/50 backdrop-blur-sm pt-20 pb-32">
            <div className="max-w-7xl mx-auto px-6 flex flex-col items-center space-y-12">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-emerald-100" />
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-900/30">
                        Guided by Wisdom, Driven by Faith
                    </p>
                    <div className="w-12 h-px bg-emerald-100" />
                </div>

                <div className="text-center space-y-8">
                    <p className="text-4xl md:text-5xl font-serif text-emerald-950/20 italic select-none">
                        "Indeed, my prayer, my rites of sacrifice, my living and my dying are for Allah, Lord of the worlds."
                    </p>
                    <div className="flex flex-col items-center space-y-4">
                        <h1 className="text-2xl font-black tracking-tight text-[#0D4433] opacity-40">
                            IMAM
                        </h1>
                        <p className="text-[9px] font-medium text-emerald-900/20 max-w-xs leading-relaxed uppercase tracking-widest">
                            A spiritual environment for the next generation of Ummah.
                        </p>
                    </div>
                </div>

                <div className="pt-20 flex gap-10">
                    {['Privacy', 'Ethics', 'Methodology'].map(link => (
                        <a key={link} href="#" className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-900/20 hover:text-emerald-950 transition-colors">
                            {link}
                        </a>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default HomeFooter;
