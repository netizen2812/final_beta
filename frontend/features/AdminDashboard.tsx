import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
    Users, Activity, Video, BarChart2, Shield,
    RefreshCw, TrendingUp, UserCheck, AlertTriangle,
    Play, StopCircle, Lock, Unlock, Server, Database, Search,
    Radio, Calendar, Layers, ChevronDown, ChevronRight, Plus
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AdminDashboardProps {
    onNavigateToLive?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateToLive }) => {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [tab, setTab] = useState<'overview' | 'sessions' | 'users' | 'batches'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Form States
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [newBatchName, setNewBatchName] = useState("");
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [newSessionData, setNewSessionData] = useState({ title: "", batchId: "", date: "" });

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } });
            setStats(res.data);
            setError(null);
        } catch (err: any) {
            console.error("Fetch stats error", err);
            setError("Failed to load stats. Are you an admin?");
        } finally { setLoading(false); }
    };

    const fetchSessions = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/sessions`, { headers: { Authorization: `Bearer ${token}` } });
            setSessions(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchBatches = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/batches`, { headers: { Authorization: `Bearer ${token}` } });
            setBatches(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchUsers = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/users`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const createBatch = async () => {
        if (!newBatchName) return;
        try {
            const token = await getToken();
            // Assign current admin as scholar for simplicity in this version, or add scholar picker later
            await axios.post(`${API_BASE}/api/admin/batches`,
                { name: newBatchName, scholar: users.find(u => u.role === 'scholar')?._id || users[0]?._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowBatchModal(false);
            setNewBatchName("");
            fetchBatches();
        } catch (err) { alert("Failed to create batch"); }
    };

    const createSession = async () => {
        if (!newSessionData.batchId || !newSessionData.date) return;
        try {
            const token = await getToken();
            await axios.post(`${API_BASE}/api/admin/sessions`,
                {
                    title: newSessionData.title,
                    batchId: newSessionData.batchId,
                    scheduledAt: newSessionData.date
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setShowSessionModal(false);
            fetchSessions();
        } catch (err) { alert("Failed to schedule session"); }
    };

    useEffect(() => {
        fetchStats();
        if (tab === 'sessions') { fetchSessions(); fetchBatches(); }
        if (tab === 'users') fetchUsers();
        if (tab === 'batches') fetchBatches();
    }, [tab]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-800 font-bold">
            <RefreshCw className="animate-spin mr-2" /> Loading Dashboard...
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8 text-center">
            <Shield size={64} className="mb-4" />
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="max-w-md">{error}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-[#022c22] text-white p-6 sticky top-0 z-50 shadow-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg"><Shield size={24} className="text-[#022c22]" /></div>
                    <div>
                        <h1 className="text-xl font-bold font-serif tracking-wide">Imam Admin</h1>
                        <p className="text-xs text-emerald-400 font-mono">SYSTEM MONITOR</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {[
                        { id: 'overview', icon: BarChart2, label: 'Overview' },
                        { id: 'users', icon: Users, label: 'Users' },
                        { id: 'batches', icon: Layers, label: 'Batches' },
                        { id: 'sessions', icon: Video, label: 'Sessions' }
                    ].map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === t.id ? 'bg-emerald-600 text-white' : 'hover:bg-white/10 text-emerald-200'}`}
                        >
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

                {/* 1. OVERVIEW TAB */}
                {tab === 'overview' && stats && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Platform Health */}
                        <Section title="Platform Health" icon={<Activity size={18} />}>
                            <StatCard label="Total Users" value={stats.health.totalUsers} trend={`+${stats.health.newUsersToday} today`} />
                            <StatCard label="Daily Active (DAU)" value={stats.health.dau} />
                            <StatCard label="Weekly Active (WAU)" value={stats.health.wau} />
                        </Section>

                        {/* Learning Progress */}
                        <Section title="Learning Progress" icon={<Database size={18} />}>
                            <StatCard label="Lessons Today" value={stats.learning.lessonsToday} />
                            <StatCard label="Avg Lessons/Child" value={stats.learning.avgLessonsPerChild} />
                            <div className="bg-white p-5 rounded-xl border border-slate-200">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">XP Distribution</div>
                                <div className="flex gap-1 h-20 items-end">
                                    <div style={{ height: '30%' }} className="bg-slate-200 flex-1 rounded-t tooltip" title={`Low: ${stats.learning.xpDistribution.low}`}></div>
                                    <div style={{ height: '60%' }} className="bg-emerald-300 flex-1 rounded-t tooltip" title={`Mid: ${stats.learning.xpDistribution.mid}`}></div>
                                    <div style={{ height: '40%' }} className="bg-emerald-500 flex-1 rounded-t tooltip" title={`High: ${stats.learning.xpDistribution.high}`}></div>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                                    <span>Beginner</span><span>Intermediate</span><span>Adv</span>
                                </div>
                            </div>
                        </Section>

                        {/* Risk Alerts */}
                        <Section title="Risk Alerts" icon={<AlertTriangle size={18} className="text-amber-500" />}>
                            <StatCard label="Inactive > 7 Days" value={stats.risk.inactive7Days} trend="Needs Attention" icon={<UserCheck className="text-red-500" />} />
                        </Section>
                    </div>
                )}

                {/* 2. USERS TAB (HIERARCHICAL) */}
                {tab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between">
                            <h2 className="font-bold text-lg">User Directory</h2>
                            <button onClick={fetchUsers} className="text-emerald-600 font-bold text-sm flex gap-1 items-center"><RefreshCw size={14} /> Refresh</button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {users.map(parent => (
                                <div key={parent._id} className="group">
                                    <div
                                        className="p-4 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                                        onClick={() => setExpandedUser(expandedUser === parent._id ? null : parent._id)}
                                    >
                                        <div className="flex items-center gap-4">
                                            {expandedUser === parent._id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            <div>
                                                <div className="font-bold text-slate-800">{parent.name}</div>
                                                <div className="text-xs text-slate-500">{parent.email}</div>
                                            </div>
                                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-bold uppercase">{parent.children?.length || 0} Children</span>
                                        </div>
                                        <div className="text-xs text-slate-400">Joined {new Date(parent.joinedAt).toLocaleDateString()}</div>
                                    </div>

                                    {/* Expanded Children View */}
                                    {expandedUser === parent._id && (
                                        <div className="bg-slate-50/50 p-4 pl-12 border-t border-slate-100 shadow-inner">
                                            {parent.children && parent.children.length > 0 ? (
                                                <table className="w-full text-sm">
                                                    <thead className="text-xs text-slate-400 font-bold uppercase text-left">
                                                        <tr>
                                                            <th className="pb-2">Child Name</th>
                                                            <th className="pb-2">Batch</th>
                                                            <th className="pb-2">XP</th>
                                                            <th className="pb-2">Completed</th>
                                                            <th className="pb-2">Last Active</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {parent.children.map((child: any) => (
                                                            <tr key={child._id} className="border-b border-slate-100 last:border-0">
                                                                <td className="py-2 font-medium">{child.name}</td>
                                                                <td className="py-2"><span className="bg-white border px-2 py-0.5 rounded textxs">{child.batchName}</span></td>
                                                                <td className="py-2 text-emerald-600 font-bold">{child.xp}</td>
                                                                <td className="py-2">{child.completed} lessons</td>
                                                                <td className="py-2 text-slate-500">{child.lastActive ? new Date(child.lastActive).toLocaleDateString() : 'Never'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <div className="text-slate-400 italic text-sm">No children profiles registered.</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. BATCHES TAB */}
                {tab === 'batches' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-xl text-slate-800">Learning Batches</h2>
                            <button onClick={() => setShowBatchModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex gap-2 items-center hover:bg-emerald-700">
                                <Plus size={16} /> New Batch
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {batches.map(batch => (
                                <div key={batch._id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-bold text-lg text-slate-800">{batch.name}</h3>
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${batch.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{batch.status}</span>
                                    </div>
                                    <div className="space-y-2 text-sm text-slate-600">
                                        <div className="flex items-center gap-2"><UserCheck size={14} className="text-emerald-500" /> Scholar: {batch.scholar?.name || "Unassigned"}</div>
                                        <div className="flex items-center gap-2"><Users size={14} className="text-blue-500" /> {batch.students?.length || 0} Students</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 4. SESSIONS TAB */}
                {tab === 'sessions' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="font-bold text-xl text-slate-800">Class Sessions</h2>
                            <button onClick={() => setShowSessionModal(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex gap-2 items-center hover:bg-emerald-700">
                                <Plus size={16} /> Schedule Session
                            </button>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Title</th>
                                        <th className="px-6 py-4">Batch</th>
                                        <th className="px-6 py-4">Scheduled For</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sessions.map(s => (
                                        <tr key={s._id}>
                                            <td className="px-6 py-4 font-bold">{s.title || "Untitled Session"}</td>
                                            <td className="px-6 py-4">{s.batchId?.name}</td>
                                            <td className="px-6 py-4">{new Date(s.scheduledAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 uppercase text-xs font-bold">{s.status}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            {showBatchModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
                        <h3 className="font-bold text-lg">Create New Batch</h3>
                        <input className="w-full border p-2 rounded-lg" placeholder="Batch Name (e.g. Quran A)" value={newBatchName} onChange={e => setNewBatchName(e.target.value)} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowBatchModal(false)} className="text-slate-500 px-4 py-2">Cancel</button>
                            <button onClick={createBatch} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Create</button>
                        </div>
                    </div>
                </div>
            )}

            {showSessionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm space-y-4">
                        <h3 className="font-bold text-lg">Schedule Session</h3>
                        <input className="w-full border p-2 rounded-lg" placeholder="Session Title" value={newSessionData.title} onChange={e => setNewSessionData({ ...newSessionData, title: e.target.value })} />
                        <select className="w-full border p-2 rounded-lg" onChange={e => setNewSessionData({ ...newSessionData, batchId: e.target.value })}>
                            <option value="">Select Batch</option>
                            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <input type="datetime-local" className="w-full border p-2 rounded-lg" onChange={e => setNewSessionData({ ...newSessionData, date: e.target.value })} />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowSessionModal(false)} className="text-slate-500 px-4 py-2">Cancel</button>
                            <button onClick={createSession} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold">Schedule</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Section = ({ title, icon, children }: any) => (
    <div>
        <h2 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">{icon} {title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

const StatCard = ({ label, value, trend, icon }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
        {trend && <div className="text-xs font-bold text-emerald-600 mt-2">{trend}</div>}
        {icon && <div className="absolute top-4 right-4 opacity-10">{icon}</div>}
    </div>
);

export default AdminDashboard;
