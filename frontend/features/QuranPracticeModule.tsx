import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle2, XCircle, ChevronRight, Award, HelpCircle, AlignCenter, ArrowRight, Play, Pause, Volume2, RotateCcw } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { QURAN_METADATA } from '../quranMetadata';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface QuranPracticeModuleProps {
    childId: string;
    onComplete?: (score: number) => void;
    initialMode?: ModuleStep;
}

type ModuleStep = 'REVISE' | 'PRACTICE' | 'RESULT';

const QuranPracticeModule: React.FC<QuranPracticeModuleProps> = ({ childId, onComplete, initialMode = 'REVISE' }) => {
    const { getToken, userId } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [revisionText, setRevisionText] = useState<any>(null);
    const [step, setStep] = useState<ModuleStep>(initialMode);
    const [xpAwarded, setXpAwarded] = useState(0);
    
    // Practice State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);

    // Audio State
    const [playingAyah, setPlayingAyah] = useState<number | null>(null);
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
    const [isPlayingAll, setIsPlayingAll] = useState(false);

    useEffect(() => {
        return () => {
            if (audio) {
                audio.pause();
                audio.src = '';
            }
        };
    }, [audio]);

    useEffect(() => {
        fetchAssignment();
    }, [childId]);

    const fetchAssignment = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/quran/assignments/child/${childId}/active`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data) {
                setAssignment(res.data.assignment);
                setQuestions(res.data.questions);
                
                // Fetch Revision Text
                const textRes = await axios.get(`${API_BASE}/api/quran/assignments/juz/${res.data.assignment.juz}/subpart/${res.data.assignment.subpart}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRevisionText(textRes.data);
            }
        } catch (err) {
            console.error("Failed to fetch assignment", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (selectedOption !== null) return;
        setSelectedOption(index);
        
        const isCorrect = index === questions[currentIndex].correctAnswer;
        if (isCorrect) {
            setScore(prev => prev + 1);
        }

        setTimeout(() => {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                handleFinish();
            }
        }, 1500);
    };

    const handleFinish = async () => {
        const finalScore = Math.round((score / questions.length) * 100);
        setStep('RESULT');
        try {
            const token = await getToken();
            const res = await axios.patch(`${API_BASE}/api/quran/assignments/${assignment._id}/progress`, {
                score: finalScore,
                totalQuestions: questions.length,
                userId: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            if (res.data.xpAwarded) {
                setXpAwarded(res.data.xpAwarded);
            }

            if (onComplete) onComplete(finalScore);
        } catch (err) {
            console.error("Failed to save progress", err);
        }
    };

    const handleRevisionFinish = async () => {
        try {
            stopAudio();
            const token = await getToken();
            const res = await axios.post(`${API_BASE}/api/quran/assignments/${assignment._id}/complete-revision`, {
                userId: userId
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.xpAwarded) {
                setXpAwarded(res.data.xpAwarded);
            }

            if (initialMode === 'REVISE') {
                setStep('RESULT');
            } else {
                setStep('PRACTICE');
            }
        } catch (err) {
            console.error("Failed to complete revision", err);
            setStep('PRACTICE'); // Move to practice anyway
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-emerald-800 font-bold">Loading your assignment...</div>;

    if (!assignment || questions.length === 0) {
        return (
            <div className="p-10 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
                <h3 className="text-xl font-bold text-slate-800">No Active Assignment</h3>
                <p className="text-slate-500 mt-2 text-sm">Ask your scholar to assign you a Juz part to practice!</p>
            </div>
        );
    }

    if (step === 'RESULT') {
        const finalPercentage = Math.round((score / questions.length) * 100);
        return (
            <div className="p-10 text-center bg-[#022c22] text-white rounded-[3rem] shadow-2xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
                <Award size={80} className="mx-auto text-yellow-500 animate-bounce" />
                <div>
                    <h2 className="text-3xl font-serif font-bold">MashaAllah!</h2>
                    <p className="text-emerald-400 font-mono mt-2 uppercase tracking-widest">
                        {initialMode === 'REVISE' ? 'Revision Mastery' : 'Revision & Practice Done'}
                    </p>
                </div>
                
                {xpAwarded > 0 && (
                    <div className="bg-emerald-500/10 py-4 px-8 rounded-2xl border border-emerald-500/20 inline-block animate-pulse">
                        <span className="text-2xl font-black text-emerald-400">+{xpAwarded} XP Earned</span>
                    </div>
                )}

                <div className="text-6xl font-black font-mono">
                    {initialMode === 'REVISE' ? '100%' : `${finalPercentage}%`}
                </div>
                <p className="text-emerald-200/70 text-sm max-w-xs mx-auto">
                    {initialMode === 'REVISE' 
                        ? "You've completed your revision lesson. Reviewing frequently builds lasting connection."
                        : `Excellent progress! You got ${score} out of ${questions.length} questions correct. Your scholar is proud.`
                    }
                </p>
                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-emerald-500 rounded-2xl font-bold hover:bg-emerald-400 transition-all text-[#022c22] shadow-[0_10px_30px_rgba(16,185,129,0.3)]"
                >
                    Back to Lobby
                </button>
            </div>
        );
    }

    const playAyah = (url: string, index: number) => {
        if (audio) {
            audio.pause();
            if (playingAyah === index) {
                setPlayingAyah(null);
                setIsPlayingAll(false);
                return;
            }
        }
        
        const newAudio = new Audio(url);
        setAudio(newAudio);
        setPlayingAyah(index);
        newAudio.play();
        
        newAudio.onended = () => {
            setPlayingAyah(null);
            if (isPlayingAll && index < revisionText.ayahs.length - 1) {
                playAyah(revisionText.ayahs[index + 1].audio, index + 1);
            } else {
                setIsPlayingAll(false);
            }
        };
    };

    const stopAudio = () => {
        if (audio) {
            audio.pause();
            setPlayingAyah(null);
            setIsPlayingAll(false);
        }
    };

    if (step === 'REVISE') {
        const metadata = QURAN_METADATA[assignment.juz]?.find((m: any) => m.part === assignment.subpart);
        
        return (
            <div className="bg-[#f8faf9] p-4 md:p-8 rounded-[3rem] shadow-2xl border border-emerald-100 max-w-4xl mx-auto flex flex-col h-[85vh] relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 relative z-10 px-2">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-900 text-emerald-100 p-3 rounded-2xl shadow-lg shadow-emerald-900/20">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-serif font-bold text-emerald-950 leading-tight">Revision Mode</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md uppercase tracking-wider border border-emerald-200">
                                    Juz {assignment.juz}
                                </span>
                                <span className="text-emerald-600/60 font-medium text-sm">
                                    {metadata?.label || `Part ${assignment.subpart}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isPlayingAll ? (
                            <button 
                                onClick={stopAudio}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-100 text-red-700 rounded-full font-bold text-sm hover:bg-red-200 transition-all shadow-sm border border-red-200"
                            >
                                <Pause size={16} fill="currentColor" /> Stop Audio
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    setIsPlayingAll(true);
                                    if (revisionText?.ayahs?.length > 0) {
                                        playAyah(revisionText.ayahs[0].audio, 0);
                                    }
                                }}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-900 text-white rounded-full font-bold text-sm hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/20 border border-emerald-800"
                            >
                                <Play size={16} fill="currentColor" /> Listen All
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 md:px-6 py-4 custom-scrollbar space-y-8 relative z-10">
                    {revisionText?.ayahs?.map((a: any, i: number) => {
                        const isActive = playingAyah === i;
                        return (
                            <div 
                                key={i} 
                                className={`group p-8 rounded-[2.5rem] transition-all duration-500 border ${isActive ? 'bg-emerald-50 border-emerald-200 shadow-xl scale-[1.01]' : 'bg-white border-slate-100 hover:border-emerald-100 hover:shadow-md'}`}
                            >
                                <div className="flex flex-col gap-6">
                                    <div className="flex justify-between items-start gap-4">
                                        <button 
                                            onClick={() => playAyah(a.audio, i)}
                                            className={`p-3 rounded-full transition-all ${isActive ? 'bg-emerald-500 text-white shadow-lg rotate-12' : 'bg-slate-50 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600'}`}
                                        >
                                            {isActive ? <Pause size={20} fill="currentColor" /> : <Volume2 size={20} />}
                                        </button>
                                        
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-3 py-1 bg-slate-50 text-slate-400 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tighter">
                                                {a.surah} : {a.number}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 text-center md:text-right">
                                        <p 
                                            className={`text-3xl md:text-5xl font-serif leading-[2] md:leading-[1.8] text-right transition-colors ${isActive ? 'text-[#0D4433]' : 'text-slate-800'}`} 
                                            dir="rtl"
                                        >
                                            {a.text}
                                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border-2 mx-4 text-sm font-sans font-black transition-all ${isActive ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-emerald-100 text-emerald-600'}`}>
                                                {a.number}
                                            </span>
                                        </p>
                                        
                                        <p className={`text-lg md:text-xl font-medium leading-relaxed transition-colors text-left border-l-4 pl-6 ${isActive ? 'text-emerald-900 border-emerald-500' : 'text-slate-400 border-slate-100'}`}>
                                            {a.translation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    
                    {(!revisionText || !revisionText.ayahs) && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-6 opacity-80 py-20">
                            <div className="w-20 h-20 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin" />
                            <div className="text-center">
                                <p className="font-bold text-lg text-emerald-950">Generating your revision sanctum...</p>
                                <p className="text-sm mt-1">Fetching authentic text and audio</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t border-emerald-100 relative z-10 bg-gradient-to-t from-[#f8faf9] to-transparent p-2">
                    <button 
                        onClick={handleRevisionFinish}
                        className="w-full bg-emerald-900 text-white py-5 rounded-[2rem] font-black text-xl hover:bg-emerald-800 hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-4 group"
                    >
                        {initialMode === 'REVISE' ? 'Finish Revision' : "I'm Ready for Q&A"} 
                        <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    <p className="text-center text-[11px] text-emerald-600/60 font-bold mt-4 uppercase tracking-[0.2em]">Read and listen deeply. Excellence is found in reflection.</p>
                </div>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];

    return (
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700"><CheckCircle2 size={18} /></div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Juz {assignment.juz} • {QURAN_METADATA[assignment.juz]?.find(m => m.part === assignment.subpart)?.label || `Part ${assignment.subpart}`}
                        </div>
                        <div className="text-sm font-bold text-slate-800">Practice Q&A</div>
                    </div>
                </div>
                <div className="text-xs font-mono font-bold bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    {currentIndex + 1} / {questions.length}
                </div>
            </div>

            {/* Question Card */}
            <div className="space-y-8 min-h-[400px]">
                <div className="text-xl font-medium text-slate-800 leading-relaxed italic border-l-4 border-emerald-500 pl-6 py-2">
                    "{currentQuestion.question}"
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {currentQuestion.options.map((option: string, idx: number) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === currentQuestion.correctAnswer;
                        
                        let bgColor = 'bg-slate-50 hover:bg-emerald-50 text-slate-700';
                        if (selectedOption !== null) {
                            if (isCorrect) bgColor = 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-200';
                            else if (isSelected) bgColor = 'bg-red-500 text-white border-red-500';
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                disabled={selectedOption !== null}
                                className={`w-full text-left p-5 rounded-2xl border-2 border-transparent font-medium transition-all flex justify-between items-center ${bgColor}`}
                            >
                                {option}
                                {selectedOption !== null && isCorrect && <CheckCircle2 size={18} />}
                                {selectedOption !== null && isSelected && !isCorrect && <XCircle size={18} />}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                    <HelpCircle size={14} />
                    <p className="text-[10px] font-medium">Earn XP for every correct answer!</p>
                </div>
                <button onClick={() => setStep('REVISE')} className="text-[10px] text-emerald-600 font-bold hover:underline">Re-read Verses</button>
            </div>
        </div>
    );
};

export default QuranPracticeModule;
