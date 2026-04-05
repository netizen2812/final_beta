import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, User, Calendar, CheckCircle, Clock, ChevronRight, Users, Info, Loader2 } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { QURAN_METADATA } from '../quranMetadata';

import { API_BASE } from '../lib/api';

interface ScholarQuranManagerProps {
    batchId?: string;
    batchName?: string;
    onClose?: () => void;
}

const ScholarQuranManager: React.FC<ScholarQuranManagerProps> = ({ batchId, batchName, onClose }) => {
    const { getToken } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [juz, setJuz] = useState(1);
    const [selectedSubparts, setSelectedSubparts] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isBatchMode, setIsBatchMode] = useState(false);
    const [activeTab, setActiveTab] = useState<'assign' | 'track'>('assign');
    const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    useEffect(() => {
        // Reset selection when Juz changes
        setSelectedSubparts([]);
    }, [juz]);

    useEffect(() => {
        const fetchStudents = async () => {
            if (!batchId) return;
            try {
                const token = await getToken();
                const res = await axios.get(`${API_BASE}/api/live/batch/${batchId}/students`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStudents(res.data || []);
            } catch (err) {}
        };
        fetchStudents();
    }, [batchId, getToken]);

    useEffect(() => {
        const fetchAssignments = async () => {
            if (!batchId) return; // Always fetch assignments to show "Recent" even in assign tab
            try {
                const token = await getToken();
                const res = await axios.get(`${API_BASE}/api/quran/assignments/batch/${batchId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setActiveAssignments(res.data || []);
            } catch (err) {
                console.error("Fetch assignments error:", err);
            }
        };
        fetchAssignments();
    }, [batchId, activeTab, getToken, refreshTrigger]);

    const toggleSubpart = (num: number) => {
        setSelectedSubparts(prev => 
            prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num].sort((a, b) => a - b)
        );
    };

    const selectAll = () => setSelectedSubparts([...Array(15)].map((_, i) => i + 1));
    const clearAll = () => setSelectedSubparts([]);

    const handleAssign = async () => {
        if (!isBatchMode && !selectedChild) return alert("Select a student first");
        if (selectedSubparts.length === 0) return alert("Select at least one subpart");
        
        setLoading(true);
        setMessage('');
        try {
            const token = await getToken();
            const payload = isBatchMode 
                ? { batchId, juz, subparts: selectedSubparts }
                : { childId: selectedChild._id, juz, subparts: selectedSubparts };

            const endpoint = isBatchMode 
                ? `${API_BASE}/api/quran/assignments/batch-assign`
                : `${API_BASE}/api/quran/assignments/assign`;

            await axios.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage(`✅ ${isBatchMode ? 'Batch' : 'Successfully'} assigned Juz ${juz} Parts: ${selectedSubparts.join(', ')}`);
            setSelectedSubparts([]); // Reset after success
            setRefreshTrigger(prev => prev + 1); // Refresh the list
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            console.error("Assignment failed:", err);
            alert(err.response?.data?.message || err.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    const handleMarkComplete = async (assignmentId: string) => {
        try {
            setLoading(true);
            const token = await getToken();
            await axios.patch(`${API_BASE}/api/quran/assignments/${assignmentId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRefreshTrigger(prev => prev + 1);
        } catch (err) {
            alert("Failed to mark as complete");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header Info */}
            <div className="bg-emerald-900/40 p-6 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button 
                            onClick={onClose}
                            className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 p-2.5 rounded-full border border-emerald-800/50 transition-all active:scale-90"
                        >
                            <ChevronRight className="rotate-180" size={24} />
                        </button>
                    )}
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                            <BookOpen className="text-emerald-400" />
                            {batchName || 'Quran Management'}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <button 
                                onClick={() => setActiveTab('assign')}
                                className={`text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'assign' ? 'text-emerald-400 underline underline-offset-4' : 'text-emerald-200/50 hover:text-emerald-200'}`}
                            >
                                Assign Work
                            </button>
                            <span className="text-emerald-500/20">|</span>
                            <button 
                                onClick={() => setActiveTab('track')}
                                className={`text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'track' ? 'text-emerald-400 underline underline-offset-4' : 'text-emerald-200/50 hover:text-emerald-200'}`}
                            >
                                Track Progress ({activeAssignments.length})
                            </button>
                        </div>
                    </div>
                </div>
                {activeTab === 'assign' && (
                    <button 
                        onClick={() => setIsBatchMode(!isBatchMode)}
                        className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${isBatchMode ? 'bg-amber-400 text-amber-950 shadow-lg' : 'bg-white/10 text-emerald-300 hover:bg-white/20'}`}
                    >
                        <Users size={18} /> {isBatchMode ? 'Batch Mode ON' : 'Switch to Batch Assign'}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {activeTab === 'assign' ? (
                    <>
                        {/* Left: Student Selection (Hidden in Batch Mode) */}
                        {!isBatchMode && (
                            <div className="lg:col-span-4 bg-[#052e16] p-6 rounded-3xl border border-emerald-500/10 shadow-xl h-fit">
                                <h3 className="text-emerald-400 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                                    <User size={16} /> Select Student
                                </h3>
                                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {students.length > 0 ? students.map(s => (
                                        <button
                                            key={s._id}
                                            onClick={() => setSelectedChild(s)}
                                            className={`w-full text-left p-4 rounded-2xl transition-all border flex items-center justify-between ${selectedChild?._id === s._id ? 'bg-emerald-500 border-emerald-400 text-[#022c22] font-bold shadow-lg' : 'bg-black/20 border-white/5 text-emerald-100 hover:bg-black/40'}`}
                                        >
                                            <span className="truncate">{s.name}</span>
                                            <ChevronRight size={16} opacity={0.5} />
                                        </button>
                                    )) : (
                                        <div className="py-10 text-center space-y-4">
                                            <div className="flex justify-center"><Users size={32} className="text-emerald-500/20" /></div>
                                            <p className="text-emerald-500/50 text-xs italic px-4">No students found or still loading...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Quick "Mark Complete" list in Sidebar for quick access */}
                                {activeAssignments.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-white/5">
                                        <h4 className="text-[10px] font-black uppercase text-emerald-500/50 tracking-widest mb-4">Pending Recitations</h4>
                                        <div className="space-y-3">
                                            {activeAssignments.slice(0, 5).map(a => (
                                                <div key={a._id} className="bg-black/40 p-3 rounded-xl border border-white/5 flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="text-[10px] font-bold text-white truncate">{a.studentId?.name || 'Student'}</div>
                                                        <div className="text-[8px] text-emerald-400">J{a.juz} P{a.subpart}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleMarkComplete(a._id)}
                                                        className="bg-emerald-500 hover:bg-emerald-400 text-black p-1.5 rounded-lg active:scale-90 transition-all"
                                                    >
                                                        <CheckCircle size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {activeAssignments.length > 5 && (
                                                <button onClick={() => setActiveTab('track')} className="text-[10px] text-emerald-400/50 hover:text-emerald-400 font-bold w-full text-center">View all {activeAssignments.length} pending...</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Right: Assignment Form */}
                        <div className={`${isBatchMode ? 'lg:col-span-12' : 'lg:col-span-8'} bg-[#052e16] p-8 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden h-fit`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-10 -mt-10" />
                            
                            <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
                                {isBatchMode ? 'Assign to ALL Students' : 'Create Assignment'}
                            </h3>

                            <div className="space-y-8 relative z-10">
                                {selectedChild && !isBatchMode && (
                                    <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-[#022c22] font-bold text-xl">
                                            {selectedChild.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-white text-lg">{selectedChild.name}</div>
                                            <div className="text-xs text-emerald-400 font-medium">Ready for new assignment</div>
                                        </div>
                                    </div>
                                )}

                                {isBatchMode && (
                                    <div className="bg-amber-400/10 p-4 rounded-2xl border border-amber-400/20 flex items-center gap-4">
                                        <div className="bg-amber-400 p-3 rounded-xl text-[#022c22]"><Users size={20} /></div>
                                        <div>
                                            <div className="font-bold text-white">Universal Assignment</div>
                                            <div className="text-xs text-amber-200/70">This will be assigned to all {students.length} students in {batchName || 'this batch'}.</div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Step 1: Select Juz</label>
                                        <div className="flex flex-wrap gap-2">
                                            {[...Array(30)].map((_, i) => (
                                                <button
                                                    key={i+1}
                                                    onClick={() => setJuz(i+1)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${juz === i+1 ? 'bg-emerald-500 border-emerald-400 text-[#022c22] shadow-lg' : 'bg-black/40 border-emerald-500/10 text-emerald-100 hover:border-emerald-500/30'}`}
                                                >
                                                    Juz {i+1}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Step 2: Select Subparts (1-15)</label>
                                            <div className="flex gap-2">
                                                <button onClick={selectAll} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-md hover:bg-emerald-500/30 transition-all font-bold uppercase tracking-tighter">Select All</button>
                                                <button onClick={clearAll} className="text-[10px] bg-red-500/20 text-red-300 px-2 py-1 rounded-md hover:bg-red-500/30 transition-all font-bold uppercase tracking-tighter">Clear</button>
                                            </div>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                                                {[...Array(15)].map((_, i) => {
                                                    const partNum = i + 1;
                                                    const metadata = QURAN_METADATA[juz]?.find(m => m.part === partNum);
                                                    const isSelected = selectedSubparts.includes(partNum);
                                                    return (
                                                        <button 
                                                            key={partNum} 
                                                            onClick={() => toggleSubpart(partNum)}
                                                            className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-1 relative overflow-hidden group ${isSelected ? 'bg-emerald-500 border-emerald-400 text-[#022c22] shadow-lg scale-[1.02]' : 'bg-black/40 border-white/5 text-emerald-100 hover:border-emerald-500/30'}`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className={`text-[10px] font-black ${isSelected ? 'text-[#022c22]/70' : 'text-emerald-500/70'}`}>PART {partNum}</span>
                                                                {isSelected && <div className="bg-[#022c22] text-emerald-400 rounded-full p-0.5"><CheckCircle size={10} /></div>}
                                                            </div>
                                                            <div className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-[#022c22]' : 'text-white'}`}>
                                                                {metadata?.label || `Part ${partNum}`}
                                                            </div>
                                                            {!isSelected && <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleAssign}
                                    disabled={loading || (!isBatchMode && !selectedChild) || selectedSubparts.length === 0}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:grayscale"
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : isBatchMode ? `Assign ${selectedSubparts.length} Parts to Batch` : `Confirm & Assign ${selectedSubparts.length} Parts`}
                                </button>

                                {message && (
                                    <div className="bg-emerald-400 text-[#022c22] p-4 rounded-2xl text-center font-bold animate-pulse shadow-lg">
                                        {message}
                                    </div>
                                )}

                                <div className="pt-6 border-t border-emerald-500/10 flex items-start gap-3">
                                    <Info className="text-emerald-500 flex-shrink-0" size={18} />
                                    <p className="text-xs text-emerald-400/60 leading-relaxed italic">
                                        Curation notice: AI-generated questions will be available instantly for the assigned students. 
                                        Separate assignments will be created for each subpart.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="lg:col-span-12 bg-[#052e16] p-8 rounded-[3rem] border border-emerald-500/20 shadow-xl min-h-[500px]">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-bold text-white">Active Recital Queue</h3>
                            {loading && <Loader2 size={24} className="animate-spin text-emerald-500" />}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeAssignments.length > 0 ? activeAssignments.map((a: any) => (
                                <div key={a._id} className="bg-black/40 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                                    <div className="min-w-0">
                                        <div className="font-bold text-white text-lg truncate whitespace-nowrap overflow-hidden">{a.studentId?.name || 'Unknown Student'}</div>
                                        <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black inline-block mt-2">
                                            JUZ {a.juz} • PART {a.subpart}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleMarkComplete(a._id)}
                                        disabled={loading}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-[#022c22] p-4 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                </div>
                            )) : (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-30 italic">
                                    <BookOpen size={48} className="mb-4" />
                                    <p>No active assignments in this batch.</p>
                                    <button onClick={() => setActiveTab('assign')} className="mt-4 text-emerald-400 underline not-italic font-bold">Assign something now</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScholarQuranManager;
