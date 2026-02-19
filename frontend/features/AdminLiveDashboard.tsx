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
    const [activeTab, setActiveTab] = useState<'requests' | 'batches'>('requests');

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
                </div>
            </div>

            {activeTab === 'requests' ? <AccessRequests token={getToken} /> : <BatchManager token={getToken} />}
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
        schedule: { days: [], time: '', durationMinutes: 60 }
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
                        <input className="border p-2 rounded" type="text" placeholder="Time (e.g. 18:00 UTC)" value={newItem.schedule.time} onChange={e => setNewItem({ ...newItem, schedule: { ...newItem.schedule, time: e.target.value } })} />
                        <input className="border p-2 rounded" type="number" placeholder="Duration (mins)" value={newItem.schedule.durationMinutes} onChange={e => setNewItem({ ...newItem, schedule: { ...newItem.schedule, durationMinutes: parseInt(e.target.value) } })} />
                    </div>

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
                            <p className="text-sm text-slate-500">
                                {b.schedule?.time} ({b.schedule?.durationMinutes} mins)
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Scholar: {b.scholar?.name || 'Unknown'}</p>
                        </div>
                        <button onClick={() => deleteBatch(b._id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminLiveDashboard;
