import React from 'react';
import { Sun, Smile, CloudRain, AlertTriangle } from 'lucide-react';
import { Madhab, Tone } from '../types';

interface GuidanceControlPanelProps {
    madhab: Madhab;
    setMadhab: (m: Madhab) => void;
    tone: Tone;
    setTone: (t: Tone) => void;
}

const toneOptions = [
    { icon: <Sun size={18} />, label: Tone.PEACEFUL, color: 'text-amber-500' },
    { icon: <Smile size={18} />, label: Tone.GRATEFUL, color: 'text-blue-500' },
    { icon: <CloudRain size={18} />, label: Tone.LOW, color: 'text-slate-400' },
    { icon: <AlertTriangle size={18} />, label: Tone.ANXIOUS, color: 'text-orange-500' },
];

const GuidanceControlPanel: React.FC<GuidanceControlPanelProps> = ({ madhab, setMadhab, tone, setTone }) => {
    return (
        <div className="w-[280px] flex flex-col h-full overflow-hidden bg-white/70 backdrop-blur-md border-l border-slate-100/80">
            {/* Header */}
            <div className="p-5 border-b border-slate-100/80">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#052e16]">Guidance Settings</h3>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Customize AI behaviour</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-7 no-scrollbar">

                {/* Madhab Selector */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">School of Thought</p>
                    <div className="space-y-1.5">
                        {Object.values(Madhab).map((m) => (
                            <button
                                key={m}
                                onClick={() => setMadhab(m)}
                                className={`w-full px-4 py-3 rounded-xl text-xs font-bold border transition-all text-left ${madhab === m
                                        ? 'bg-[#052e16] text-white border-[#052e16] shadow-md shadow-[#052e16]/20'
                                        : 'bg-slate-50/80 border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-[#052e16] hover:bg-emerald-50/50'
                                    }`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-slate-100" />

                {/* Tone Selector */}
                <div className="space-y-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Current Mood</p>
                    <div className="space-y-1.5">
                        {toneOptions.map((t) => (
                            <button
                                key={t.label}
                                onClick={() => setTone(t.label)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold border transition-all ${tone === t.label
                                        ? 'bg-[#052e16] text-white border-[#052e16] shadow-md shadow-[#052e16]/20'
                                        : 'bg-slate-50/80 border-slate-100 text-slate-500 hover:border-emerald-200 hover:text-[#052e16] hover:bg-emerald-50/50'
                                    }`}
                            >
                                <span className={tone === t.label ? 'text-emerald-400' : t.color}>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Info note */}
                <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100/80">
                    <p className="text-[10px] text-emerald-800/60 font-medium leading-relaxed">
                        Changes apply to the next message. Your settings are saved for this session.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GuidanceControlPanel;
