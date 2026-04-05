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
    BookOpen,
    StopCircle
} from 'lucide-react';

import { APPLICATION_API_URL } from '../lib/api';

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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-white text-[#052e16] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Access Requests
                    </button>
                    <button
                        onClick={() => setActiveTab('batches')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'batches' ? 'bg-white text-[#052e16] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Teaching Batches
                    </button>
                    <button
                        onClick={() => setActiveTab('debug')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'debug' ? 'bg-white text-[#052e16] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        System Tools
                    </button>
                </div>
            </div>

            {activeTab === 'requests' && <AccessRequests token={getToken} />}
            {activeTab === 'batches' && <BatchManager token={getToken} />}
            {activeTab === 'debug' && <DebugPanel token={getToken} />}
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
            const res = await axios.get(`${APPLICATION_API_URL}/api/live/access/admin/requests`, {
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
            await axios.post(`${APPLICATION_API_URL}/api/live/access/admin/requests/${id}/${decision}`, {}, {
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
    const [newItem, setNewItem] = useState({
        name: '',
        scholar: '',
        level: 'Beginner',
        status: 'active',
    });
    const [scholars, setScholars] = useState<any[]>([]);
    const [showManageStudents, setShowManageStudents] = useState<string | null>(null);
    const [selectedBatch, setSelectedBatch] = useState<any>(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [foundUsers, setFoundUsers] = useState<any[]>([]);

    const fetchScholars = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setScholars(res.data.filter((u: any) => u.role === 'scholar'));
        } catch (err) {
            console.error("Failed to load scholars");
        }
    };

    useEffect(() => {
        if (showCreate) fetchScholars();
    }, [showCreate]);

    const fetchBatches = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${APPLICATION_API_URL}/api/live/admin/batches`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setBatches(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchBatches(); }, []);

    const searchParents = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            setFoundUsers(res.data.filter((u: any) =>
                u.email.includes(studentSearch) || u.name.toLowerCase().includes(studentSearch.toLowerCase())
            ));
        } catch (err) { console.error(err); }
    };

    const addStudent = async (childId: string) => {
        if (!selectedBatch) return;
        try {
            const t = await token();
            await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch/${selectedBatch._id}/add-student`, { childId }, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchBatches();
        } catch (err) { alert("Failed to add student"); }
    };

    const removeStudent = async (childId: string) => {
        if (!confirm("Remove student?")) return;
        try {
            const t = await token();
            await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch/${selectedBatch._id}/remove-student`, { childId }, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchBatches();
        } catch (err) { alert("Failed to remove"); }
    };

    const openManage = (batch: any) => {
        setSelectedBatch(batch);
        setShowManageStudents(batch._id);
    };

    const createBatch = async () => {
        try {
            const t = await token();
            await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch`, newItem, {
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
            await axios.delete(`${APPLICATION_API_URL}/api/live/admin/batch/${id}`, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchBatches();
        } catch (err) {
            alert("Delete failed");
        }
    };

    const handleForceEnd = async (batchId: string) => {
        if (!confirm("EMERGENCY: Force reset this batch session?")) return;
        try {
            const t = await token();
            await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch/${batchId}/force-end`, {}, {
                headers: { Authorization: `Bearer ${t}` }
            });
            fetchBatches();
        } catch (err) {
            alert("Force end failed");
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
                    <input className="w-full border p-2 rounded" placeholder="Batch Name" value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-4">
                        <select className="w-full border p-2 rounded" value={newItem.level} onChange={e => setNewItem({ ...newItem, level: e.target.value })}>
                            <option value="Beginner">Beginner</option>
                            <option value="Intermediate">Intermediate</option>
                            <option value="Advanced">Advanced</option>
                        </select>
                        <select className="w-full border p-2 rounded" value={newItem.status} onChange={e => setNewItem({ ...newItem, status: e.target.value })}>
                            <option value="active">Active</option>
                            <option value="upcoming">Upcoming</option>
                        </select>
                    </div>
                    <select className="w-full border p-2 rounded" value={newItem.scholar} onChange={e => setNewItem({ ...newItem, scholar: e.target.value })}>
                        <option value="">Select Scholar</option>
                        {scholars.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
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
                            </div>
                            <p className="text-sm text-slate-500 mt-1">Scholar: {b.scholar?.name || 'Unknown'}</p>
                        </div>
                        <div className="flex gap-2">
                            {b.status === 'active' && (
                                <button onClick={() => handleForceEnd(b._id)} className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg">
                                    <StopCircle size={18} />
                                </button>
                            )}
                            <button onClick={() => openManage(b)} className="text-slate-400 hover:text-blue-500 p-2"><Users size={18} /></button>
                            <button onClick={() => deleteBatch(b._id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {showManageStudents && selectedBatch && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 space-y-6">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-xl">Manage Students: {selectedBatch.name}</h3>
                            <button onClick={() => setShowManageStudents(null)} className="p-2 hover:bg-slate-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-bold text-sm text-slate-500 uppercase">Add Student</h4>
                                <div className="flex gap-2">
                                    <input className="border p-2 rounded w-full text-sm" placeholder="Search..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                                    <button onClick={searchParents} className="bg-blue-600 text-white px-3 rounded text-sm font-bold">Search</button>
                                </div>
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {foundUsers.map(u => (
                                        <div key={u._id} className="p-2 border rounded">
                                            <div className="font-bold text-xs">{u.name}</div>
                                            {u.children?.map((c: any) => (
                                                <button key={c._id} onClick={() => addStudent(c._id)} className="w-full text-left text-xs p-1 bg-slate-100 hover:bg-slate-200 mt-1 rounded">
                                                    Add {c.name}
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4 border-l pl-6">
                                <h4 className="font-bold text-sm text-slate-500 uppercase">Enrolled</h4>
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {selectedBatch.students?.map((s: any) => (
                                        <div key={s._id || s} className="flex justify-between items-center bg-slate-50 p-2 rounded">
                                            <span className="text-xs">{s.name || 'Student'}</span>
                                            <button onClick={() => removeStudent(s._id || s)} className="text-red-400"><Trash2 size={14} /></button>
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

const DebugPanel = ({ token }: { token: any }) => {
    const [batches, setBatches] = useState<any[]>([]);
    const [participantsByBatch, setParticipantsByBatch] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        try {
            const t = await token();
            const res = await axios.get(`${APPLICATION_API_URL}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
            const list = res.data || [];
            setBatches(list);
            const byBatch: Record<string, any[]> = {};
            for (const b of list) {
                try {
                    const pRes = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${b._id}/participants`, { headers: { Authorization: `Bearer ${t}` } });
                    byBatch[b._id] = Array.isArray(pRes.data) ? pRes.data : [];
                } catch { byBatch[b._id] = []; }
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

    if (loading && batches.length === 0) return <Loader2 className="animate-spin mx-auto" />;

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-[#052e16]">Live Session Debug</h3>
            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="p-3">Batch</th>
                            <th className="p-3">Participants</th>
                            <th className="p-3">Position</th>
                            <th className="p-3">Last Seen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map(b => {
                            const participants = participantsByBatch[b._id] || [];
                            if (participants.length === 0) return <tr key={b._id} className="border-t"><td className="p-3">{b.name}</td><td colSpan={3} className="p-3 text-slate-400">No active students</td></tr>;
                            return participants.map((p: any, i: number) => (
                                <tr key={`${p.childId}-${i}`} className="border-t">
                                    <td className="p-3">{i === 0 ? b.name : ''}</td>
                                    <td className="p-3 font-medium">{p.childName || '—'}</td>
                                    <td className="p-3 text-slate-600">{p.currentSurah ? `S${p.currentSurah}:A${p.currentAyah}` : '—'}</td>
                                    <td className="p-3 text-slate-400 text-xs">{p.lastSeen ? new Date(p.lastSeen).toLocaleTimeString() : '—'}</td>
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminLiveDashboard;
