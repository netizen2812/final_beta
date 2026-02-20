import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import {
    ShieldCheck,
    Check,
    X,
    Loader2,
    Users,
    Calendar,
    Plus,
    Trash2,
    BookOpen
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminLiveDashboard = () => {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState<'requests' | 'batches' | 'debug'>('requests');

    return (
        <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-serif font-bold text-[#052e16]">Live Administration</h1>
                    <p className="text-slate-500">Manage access requests and teaching batches.</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white shadow text-[#052e16]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Access Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('batches')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'batches' ? 'bg-white shadow text-[#052e16]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Manage Batches
                    </button>
                    <button
                        onClick={() => setActiveTab('debug')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'debug' ? 'bg-white shadow text-[#052e16]' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Debug (temp)
                    </button>
                </div>
            </div>

            {activeTab === 'requests' && <AccessRequests token={getToken} />}
            {activeTab === 'batches' && <BatchManager token={getToken} />}
            {activeTab === 'debug' && <DebugPanel token={getToken} />}
        </div>
    );
};

/** Temporary admin debug: Session (active participants, last position, last update) — remove after test */
const DebugPanel = ({ token }: { token: any }) => {
    const [batches, setBatches] = useState<any[]>([]);
    const [participantsByBatch, setParticipantsByBatch] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
            const list = res.data || [];
            setBatches(list);
            const byBatch: Record<string, any[]> = {};
            for (const b of list) {
                try {
                    const pRes = await axios.get(`${API_BASE}/api/live/batch/${b._id}/participants`, { headers: { Authorization: `Bearer ${t}` } });
                    byBatch[b._id] = Array.isArray(pRes.data) ? pRes.data : [];
                } catch {
                    byBatch[b._id] = [];
                }
            }
            setParticipantsByBatch(byBatch);
        } catch (e) {
            console.error('Debug fetch failed', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        const interval = setInterval(fetchAll, 4000);
        return () => clearInterval(interval);
    }, []);

    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div className="space-y-6">
            <p className="text-xs text-amber-600 font-bold uppercase">Verification mode — remove after test</p>
            <h3 className="font-bold text-lg text-[#052e16]">Session</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                            <th className="text-left p-3 font-bold">Batch</th>
                            <th className="text-left p-3 font-bold">Active participants</th>
                            <th className="text-left p-3 font-bold">Last position</th>
                            <th className="text-left p-3 font-bold">Last update time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map(b => (
                            (participantsByBatch[b._id]?.length ? participantsByBatch[b._id] : [{ childName: '—', isActive: false }]).map((p: any, i: number) => (
                                <tr key={`${b._id}-${p.childId || i}`} className="border-b border-slate-100">
                                    <td className="p-3">{i === 0 ? b.name : ''}</td>
                                    <td className="p-3">{p.childName || p.childId || '—'}</td>
                                    <td className="p-3">{p.currentSurah != null ? `Surah ${p.currentSurah}, Ayah ${p.currentAyah}` : '—'}</td>
                                    <td className="p-3">{p.lastSeen ? new Date(p.lastSeen).toLocaleString() : '—'}</td>
                                </tr>
                            ))
                        ))}
                        {batches.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-500">No batches</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <h3 className="font-bold text-lg text-[#052e16] mt-8">Qibla</h3>
            <p className="text-sm text-slate-500">Open Ibadah → Qibla Finder to see user coords, magnetic heading, declination, true heading, and qibla bearing in the debug block at the bottom of the page.</p>
        </div>
    );
};

const AccessRequests = ({ token }: { token: any }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const t = await token();
            const res = await axios.get(`${API_BASE}/api/live/access/admin/requests`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setRequests(res.data);
        } catch (err) {
            console.error("Failed to load requests");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const handleDecision = async (id: string, decision: 'approve' | 'reject') => {
        try {
            const t = await token();
            await axios.post(`${API_BASE}/api/live/access/admin/requests/${id}/${decision}`, {}, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchRequests(); // reload
        } catch (err) {
            alert("Action failed");
        }
    };

    if (loading) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div className="grid gap-4">
            {requests.length === 0 && <p className="text-center text-slate-500">No pending requests.</p>}
            {requests.map(req => (
                <div key={req._id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-lg">{req.name || req.email}</h3>
                        <p className="text-sm text-slate-500">{req.email}</p>
                        <p className="text-xs text-slate-400 mt-1">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handleDecision(req._id, 'approve')} className="p-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100"><Check size={20} /></button>
                        <button onClick={() => handleDecision(req._id, 'reject')} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100"><X size={20} /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const BatchManager = ({ token }: { token: any }) => {
    const [batches, setBatches] = useState<any[]>([]);
    const [showCreate, setShowCreate] = useState(false);

    // Form State
    const [newItem, setNewItem] = useState({
        name: '',
        scholar: '',
        level: 'Beginner',
        status: 'active',
        // schedule: { days: [], time: '', durationMinutes: 60 } // Removed
    });
    const [scholars, setScholars] = useState<any[]>([]);

    const fetchScholars = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${API_BASE}/api/admin/users`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            const scholarList = res.data.filter((u: any) => u.role === 'scholar');
            setScholars(scholarList);
        } catch (err) {
            console.error("Failed to load scholars");
        }
    };

    useEffect(() => {
        if (showCreate) fetchScholars();
    }, [showCreate]);

    const [showManageStudents, setShowManageStudents] = useState<string | null>(null); // Batch ID
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);

    const fetchBatches = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${API_BASE}/api/live/admin/batches`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setBatches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const searchParents = async () => {
        // This endpoint might need to be created or use getAllUsers and client-side filter
        // For now using client side filter of all users we might have? 
        // Actually we should fetch users with search query.
        // Let's reuse /api/admin/users
        try {
            const t = await token();
            const res = await axios.get(`${API_BASE}/api/admin/users`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            const matches = res.data.filter((u: any) =>
                u.email.includes(studentSearch) || u.name.toLowerCase().includes(studentSearch.toLowerCase())
            );
            setFoundUsers(matches);
        } catch (err) { console.error(err); }
    };

    const addStudent = async (childId: string) => {
        if (!selectedBatch) return;
        try {
            const t = await token();
            await axios.post(`${API_BASE}/api/live/admin/batch/${selectedBatch._id}/add-student`, { childId }, {
                headers: { Authorization: `Bearer ${t}` }
            });
            // Refresh batch
            const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
            const updated = res.data.find((b: any) => b._id === selectedBatch._id);
            setBatches(res.data);
            setSelectedBatch(updated);
        } catch (err) { alert("Failed to add student"); }
    };

    const removeStudent = async (childId: string) => {
        if (!confirm("Remove student?")) return;
        try {
            const t = await token();
            await axios.post(`${API_BASE}/api/live/admin/batch/${selectedBatch._id}/remove-student`, { childId }, {
                headers: { Authorization: `Bearer ${t}` }
            });
            // Refresh
            const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
            const updated = res.data.find((b: any) => b._id === selectedBatch._id);
            setBatches(res.data);
            setSelectedBatch(updated);
        } catch (err) { alert("Failed to remove"); }
    };

    const openManage = (batch: any) => {
        setSelectedBatch(batch);
        setShowManageStudents(batch._id);
    };

    useEffect(() => { fetchBatches(); }, []);

    const createBatch = async () => {
        try {
            const t = await token();
            // TODO: Fetch scholar list to pick ID. For now hardcode or text input?
            // To make it easy, we will auto-assign THE scholar for now or let admin paste ID.
            // Ideally we need a user picker.
            await axios.post(`${API_BASE}/api/live/admin/batch`, newItem, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setShowCreate(false);
            fetchBatches();
        } catch (err: any) {
            alert("Create failed: " + err.message);
        }
    };

    const deleteBatch = async (id: string) => {
        if (!confirm("Delete this batch?")) return;
        try {
            const t = await token();
            await axios.delete(`${API_BASE}/api/live/admin/batch/${id}`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchBatches();
        } catch (err) {
            alert("Delete failed");
        }
    };

    return (
        <div className="space-y-6">
            <button onClick={() => setShowCreate(!showCreate)} className="bg-[#052e16] text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Plus size={18} /> Create New Batch
            </button>

            {showCreate && (
                <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                    <h3 className="font-bold">New Batch Details</h3>
                    <input className="w-full border p-2 rounded" placeholder="Batch Name (e.g. Quran Beginners A)" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />

                    <div className="grid grid-cols-2 gap-4">
                        <select className="w-full border p-2 rounded" value={newItem.level} onChange={e => setNewItem({ ...newItem, level: e.target.value })}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                        <select className="w-full border p-2 rounded" value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })}>
                            <option value="active">Active</option>
                            <option value="upcoming">Upcoming</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>

                    <select className="w-full border p-2 rounded" value={newItem.scholar} onChange={e => setNewItem({ ...newItem, scholar: e.target.value })}>
                        <option value="">Select Scholar</option>
                        {scholars.map(s => (
                            <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                        ))}
                    </select>

                    <button onClick={createBatch} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">Save Batch</button>
                </div>
            )}

            <div className="grid gap-4">
                {batches.map(b => (
                    <div key={b._id} className="bg-white p-6 rounded-2xl border border-slate-100 flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg">{b.name}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded font-mono ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>{b.status}</span>
                                <span className="bg-slate-100 text-xs px-2 py-0.5 rounded font-mono">{b.level}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1"> Scholar: {b.scholar?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openManage(b)} className="text-slate-400 hover:text-blue-500 p-2"><Users size={18} /></button>
                            <button onClick={() => deleteBatch(b._id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MANAGE STUDENTS MODAL */}
            {showManageStudents && selectedBatch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-xl">Manage Students: {selectedBatch.name}</h3>
                            <button onClick={() => setShowManageStudents(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* ADD NEW */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-slate-500 uppercase">Add Student</h4>
                                <div className="flex gap-2">
                                    <input className="border p-2 rounded w-full text-sm" placeholder="Search Parent Email/Name..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                                    <button onClick={searchParents} className="bg-blue-600 text-white px-3 rounded text-sm font-bold">Search</button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {foundUsers.map(u => (
                                        <div key={u._id} className="p-2 border rounded hover:bg-slate-50">
                                            <div className="font-bold text-xs">{u.name}</div>
                                            <div className="text-[10px] text-slate-400 mb-2">{u.email}</div>
                                            <div className="space-y-1">
                                                {u.children?.map((c: any) => (
                                                    <button key={c._id}
                                                        onClick={() => addStudent(c._id)}
                                                        disabled={selectedBatch.students?.includes(c._id)}
                                                        className={`w-full text-left text-xs p-1 rounded flex justify-between ${selectedBatch.students?.includes(c._id) ? 'bg-green-100 text-green-700' : 'bg-slate-100 hover:bg-slate-200 user-select-none cursor-pointer'}`}>
                                                        <span>{c.name}</span>
                                                        {selectedBatch.students?.includes(c._id) && <Check size={12} />}
                                                    </button>
                                                ))}
                                                {(!u.children || u.children.length === 0) && <div className="text-[10px] italic text-slate-400">No children</div>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CURRENT LIST */}
                            <div className="space-y-4 border-l pl-6">
                                <h4 className="font-bold text-sm text-slate-500 uppercase">Enrolled Students ({selectedBatch.students?.length || 0})</h4>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {/* We need full student objects or just IDs? 
                                          The Batch object returned by getAdminBatches probably populated 'students' but wait, 
                                          in getAdminBatches we populated 'scholar'. We did NOT populate 'students'.
                                          So here we likely only have IDs. 
                                          Ideally we should populate users. 
                                          Or for now just show Count, or trigger a fetch.
                                          
                                          Actually, if we only have IDs, we can't show names easily.
                                          Let's update getAdminBatches to populate students or fetch details here.
                                          For speed, let's update frontend to assume we might need to fetch details or just show IDs? No, showing IDs is bad.
                                          
                                          Let's rely on the fact that when we added them we saw them.
                                          BUT when we reload, we only see IDs.
                                          
                                          Let's just show a simple list for now, or assume we will fix getAdminBatches to populate.
                                          Let's trigger a populate on backend.
                                       */}
                                    {selectedBatch.students?.map((s: any) => (
                                        <div key={s._id || s} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                            <span className="text-xs font-bold">{typeof s === 'object' ? s.name : 'Student ID: ' + s}</span>
                                            <button onClick={() => removeStudent(typeof s === 'object' ? s._id : s)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLiveDashboard;
