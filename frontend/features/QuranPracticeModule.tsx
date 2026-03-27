import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, CheckCircle2, XCircle, ChevronRight, Award, HelpCircle, AlignCenter, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface QuranPracticeModuleProps {
    childId: string;
    onComplete?: (score: number) => void;
}

type ModuleStep = 'REVISE' | 'PRACTICE' | 'RESULT';

const QuranPracticeModule: React.FC<QuranPracticeModuleProps> = ({ childId, onComplete }) => {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [assignment, setAssignment] = useState<any>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [revisionText, setRevisionText] = useState<any>(null);
    const [step, setStep] = useState<ModuleStep>('REVISE');
    
    // Practice State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [score, setScore] = useState(0);

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
            await axios.patch(`${API_BASE}/api/quran/assignments/${assignment._id}/progress`, {
                score: finalScore,
                questionsAnswered: questions.length
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onComplete) onComplete(finalScore);
        } catch (err) {
            console.error("Failed to save progress", err);
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
                    <p className="text-emerald-400 font-mono mt-2 uppercase tracking-widest">Revision & Practice Done</p>
                </div>
                <div className="text-6xl font-black font-mono">
                    {finalPercentage}%
                </div>
                <p className="text-emerald-200/70 text-sm max-w-xs mx-auto">
                    Excellent progress! You got {score} out of {questions.length} questions correct.<br/>
                    Your scholar is proud of your dedication.
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

    if (step === 'REVISE') {
        return (
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 max-w-2xl mx-auto flex flex-col h-[700px]">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600"><BookOpen size={20} /></div>
                        <div>
                            <h3 className="font-bold text-slate-800">Revision Mode</h3>
                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Juz {assignment.juz} • Subpart {assignment.subpart}</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 bg-slate-50/50 rounded-3xl border border-slate-100 custom-scrollbar space-y-8">
                    {revisionText?.ayahs?.map((a: any, i: number) => (
                        <div key={i} className="text-center group">
                            <div className="text-3xl font-serif leading-loose text-slate-800 mb-2 drop-shadow-sm select-none" dir="rtl">
                                {a.text}
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-emerald-500/20 text-xs text-emerald-600 mr-2 font-sans font-black">
                                    {a.number}
                                </span>
                            </div>
                            <div className="text-xs text-emerald-600/60 font-medium italic opacity-0 group-hover:opacity-100 transition-opacity">
                                {a.surah}
                            </div>
                        </div>
                    ))}
                    {(!revisionText || !revisionText.ayahs) && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-50 italic">
                            <BookOpen size={40} />
                            <p>Loading text for your revision...</p>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    <button 
                        onClick={() => setStep('PRACTICE')}
                        className="w-full bg-[#022c22] text-white py-5 rounded-2xl font-black text-lg hover:bg-emerald-900 transition-all shadow-xl flex items-center justify-center gap-3 group"
                    >
                        I'm Ready for Q&A <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-bold mt-4 uppercase tracking-tighter">Read at your own pace. Click above when you're ready to test your knowledge.</p>
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
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Juz {assignment.juz} • Part {assignment.subpart}</div>
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
