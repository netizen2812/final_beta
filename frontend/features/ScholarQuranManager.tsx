import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, User, Calendar, CheckCircle, Clock, ChevronRight, Users, Info } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { QURAN_METADATA } from '../quranMetadata';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface ScholarQuranManagerProps {
    batchId?: string;
    batchName?: string;
}

const ScholarQuranManager: React.FC<ScholarQuranManagerProps> = ({ batchId, batchName }) => {
    const { getToken } = useAuth();
    const [students, setStudents] = useState<any[]>([]);
    const [selectedChild, setSelectedChild] = useState<any>(null);
    const [juz, setJuz] = useState(1);
    const [subpart, setSubpart] = useState(1);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [isBatchMode, setIsBatchMode] = useState(false);

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

    const handleAssign = async () => {
        if (!isBatchMode && !selectedChild) return alert("Select a student first");
        setLoading(true);
        try {
            const token = await getToken();
            const payload = isBatchMode 
                ? { batchId, juz, subpart }
                : { childId: selectedChild._id, juz, subpart };

            const endpoint = isBatchMode 
                ? `${API_BASE}/api/quran/assignments/batch-assign`
                : `${API_BASE}/api/quran/assignments/assign`;

            await axios.post(endpoint, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setMessage(`✅ ${isBatchMode ? 'Batch' : 'Successfully'} assigned Juz ${juz} Part ${subpart}`);
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            alert(err.response?.data?.message || "Assignment failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Header Info */}
            <div className="bg-emerald-900/40 p-6 rounded-3xl border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                        <BookOpen className="text-emerald-400" />
                        {batchName || 'Quran Management'}
                    </h2>
                    <p className="text-emerald-200/70 text-sm mt-1">Manage practice assignments for your students</p>
                </div>
                <button 
                  onClick={() => setIsBatchMode(!isBatchMode)}
                  className={`px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 ${isBatchMode ? 'bg-amber-400 text-amber-950 shadow-lg' : 'bg-white/10 text-emerald-300 hover:bg-white/20'}`}
                >
                   <Users size={18} /> {isBatchMode ? 'Batch Mode ON' : 'Switch to Batch Assign'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
                                    <span>{s.name}</span>
                                    <ChevronRight size={16} opacity={0.5} />
                                </button>
                            )) : (
                                <p className="text-emerald-500/50 text-center py-10 text-sm italic">No students found in this batch</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Right: Assignment Form */}
                <div className={`${isBatchMode ? 'lg:col-span-12' : 'lg:col-span-8'} bg-[#052e16] p-8 rounded-3xl border border-emerald-500/20 shadow-xl relative overflow-hidden`}>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Select Juz</label>
                                <select 
                                    value={juz} 
                                    onChange={(e) => setJuz(parseInt(e.target.value))}
                                    className="w-full bg-black/40 text-white p-4 rounded-2xl border border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    {[...Array(30)].map((_, i) => (
                                        <option key={i+1} value={i+1} className="bg-[#052e16]">Juz {i+1}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Select Subpart (1-15)</label>
                                <select 
                                    value={subpart} 
                                    onChange={(e) => setSubpart(parseInt(e.target.value))}
                                    className="w-full bg-black/40 text-white p-4 rounded-2xl border border-emerald-500/20 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                >
                                    {[...Array(15)].map((_, i) => {
                                        const partNum = i + 1;
                                        const metadata = QURAN_METADATA[juz]?.find(m => m.part === partNum);
                                        return (
                                            <option key={partNum} value={partNum} className="bg-[#052e16]">
                                                Part {partNum}: {metadata?.label || 'Loading...'}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={handleAssign}
                            disabled={loading || (!isBatchMode && !selectedChild)}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:grayscale"
                        >
                            {loading ? 'Propagating...' : isBatchMode ? 'Finalize Batch Assignment' : 'Confirm & Assign'}
                        </button>

                        {message && (
                            <div className="bg-emerald-400 text-[#022c22] p-4 rounded-2xl text-center font-bold animate-pulse shadow-lg">
                                {message}
                            </div>
                        )}

                        <div className="pt-6 border-t border-emerald-500/10 flex items-start gap-3">
                            <Info className="text-emerald-500 flex-shrink-0" size={18} />
                            <p className="text-xs text-emerald-400/60 leading-relaxed italic">
                                Curation notice: AI-generated questions for Juz {juz} Part {subpart} will be available instantly for the assigned students. 
                                Progress tracking will begin as soon as they start practicing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScholarQuranManager;
