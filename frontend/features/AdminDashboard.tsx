import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
    Users, Activity, Video, BarChart2, Shield,
    RefreshCw, TrendingUp, UserCheck, AlertTriangle,
    Play, StopCircle, Lock, Unlock, Server, Database, Search,
    Radio
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
    const [users, setUsers] = useState<any[]>([]);
    const [tab, setTab] = useState<'overview' | 'sessions' | 'users'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchStats = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
            setError(null);
        } catch (err: any) {
            console.error("Fetch stats error", err.response?.data || err.message);
            setError("Failed to load stats. Are you an admin?");
        } finally {
            setLoading(false);
        }
    };

    const fetchSessions = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data.sessions);
        } catch (err) {
            console.error("Fetch sessions error", err);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${API_BASE}/api/admin/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const handleForceEnd = async (sessionId: string) => {
        if (!confirm("Are you sure you want to FORCE END this session?")) return;
        try {
            const token = await getToken();
            await axios.post(`${API_BASE}/api/admin/session/${sessionId}/end`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchStats();
            fetchSessions();
            alert("Session ended.");
        } catch (err) {
            alert("Failed to end session");
        }
    };

    const toggleLiveAccess = async (userId: string, currentStatus: boolean) => {
        if (!confirm(`Turn Live Access ${currentStatus ? 'OFF' : 'ON'} for this user?`)) return;
        try {
            const token = await getToken();
            await axios.patch(`${API_BASE}/api/admin/user/${userId}/access`, { liveAccess: !currentStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) { alert("Failed to update access"); }
    };

    useEffect(() => {
        fetchStats();
        if (tab === 'sessions') fetchSessions();
        if (tab === 'users') fetchUsers();
    }, [tab]);

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-emerald-800 font-bold">
            <RefreshCw className="animate-spin mr-2" /> Verifying Admin Access...
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-8 text-center">
            <Shield size={64} className="mb-4" />
            <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
            <p className="max-w-md">{error}</p>
            <p className="text-sm mt-4 text-red-400">Allowed: sarthakjuneja1999@gmail.com</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Sidebar / Header Combo */}
            <div className="bg-[#022c22] text-white p-6 sticky top-0 z-50 shadow-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg">
                        <Shield size={24} className="text-[#022c22]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold font-serif tracking-wide">Imam Admin</h1>
                        <p className="text-xs text-emerald-400 font-mono">SYSTEM MONITOR</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'overview' ? 'bg-emerald-600 text-white' : 'hover:bg-white/10 text-emerald-200'}`}
                    >
                        <BarChart2 size={16} /> Overview
                    </button>
                    <button
                        onClick={() => setTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'users' ? 'bg-emerald-600 text-white' : 'hover:bg-white/10 text-emerald-200'}`}
                    >
                        <Users size={16} /> Users
                    </button>
                    <button
                        onClick={() => setTab('sessions')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === 'sessions' ? 'bg-emerald-600 text-white' : 'hover:bg-white/10 text-emerald-200'}`}
                    >
                        <Video size={16} /> Live Sessions
                    </button>
                    {onNavigateToLive && (
                        <button onClick={onNavigateToLive} className="px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 bg-emerald-100/10 hover:bg-white/20 text-emerald-200 border border-emerald-500/30">
                            <Radio size={16} /> Manage Classes
                        </button>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

                {/* KPI GRID */}
                {tab === 'overview' && stats && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                        {/* Growth Stats */}
                        <div>
                            <h2 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><TrendingUp size={14} /> User Growth</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <StatCard label="Total Users" value={stats.growth.totalUsers} icon={<Users size={20} className="text-blue-500" />} trend={`+${stats.growth.newUsersLast7Days} this week`} />
                                <StatCard label="Parents" value={stats.growth.totalParents} icon={<UserCheck size={20} className="text-indigo-500" />} />
                                <StatCard label="Children" value={stats.growth.totalChildren} icon={<Users size={20} className="text-pink-500" />} />
                                <StatCard label="Active Today (DAU)" value={stats.engagement.dau} icon={<Activity size={20} className="text-emerald-500" />} isLive />
                            </div>
                        </div>

                        {/* Live Stats */}
                        <div>
                            <h2 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2"><Server size={14} /> System Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <StatCard label="Active Live Sessions" value={stats.live.active} icon={<Video size={20} className="text-red-500" />} isLive />
                                <StatCard label="Total Lifetime Sessions" value={stats.live.total} icon={<Database size={20} className="text-slate-500" />} />
                                <StatCard label="Lessons Completed" value={stats.engagement.totalLessonsCompleted} icon={<BookOpen size={20} className="text-amber-500" />} />
                            </div>
                        </div>
                    </div>
                )}

                {/* USERS MANAGER */}
                {tab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center gap-4">
                            <h2 className="font-bold text-lg text-slate-800 whitespace-nowrap">User Manager</h2>
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    placeholder="Search by name or email..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button onClick={fetchUsers} className="text-sm text-emerald-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Kids</th>
                                        <th className="px-6 py-4">Joined</th>
                                        <th className="px-6 py-4">Live Access</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredUsers.map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-800">{u.name || "Unnamed"}</div>
                                                <div className="text-slate-500 text-xs">{u.email}</div>
                                                <div className="text-slate-300 text-[10px] font-mono">{u._id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === 'scholar' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-bold">{u.childCount}</td>
                                            <td className="px-6 py-4 text-slate-500 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4">
                                                {u.liveAccess ? (
                                                    <span className="flex items-center gap-1 text-emerald-600 font-bold text-xs"><Shield size={12} fill="currentColor" /> Enabled</span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-slate-400 text-xs"><Lock size={12} /> Disabled</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => toggleLiveAccess(u._id, u.liveAccess)}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${u.liveAccess
                                                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                                        : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                                        }`}
                                                >
                                                    {u.liveAccess ? 'Revoke Access' : 'Grant Access'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SESSIONS TABLE */}
                {tab === 'sessions' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-slate-800">Live Session Monitor</h2>
                            <button onClick={fetchSessions} className="text-sm text-emerald-600 font-bold hover:underline flex items-center gap-1"><RefreshCw size={14} /> Refresh</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Child ID</th>
                                        <th className="px-6 py-4">Started At</th>
                                        <th className="px-6 py-4">Duration</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sessions.map((s) => (
                                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wide border ${s.status === 'active' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' :
                                                    s.status === 'ended' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                                                        'bg-amber-50 text-amber-600 border-amber-100'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'active' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{s.childId}</td>
                                            <td className="px-6 py-4 text-slate-500">{s.startedAt ? new Date(s.startedAt).toLocaleString() : '-'}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{s.durationMinutes ? `${s.durationMinutes}m` : '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                {s.status === 'active' && (
                                                    <button
                                                        onClick={() => handleForceEnd(s._id)}
                                                        className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-md text-xs font-bold transition-colors inline-flex items-center gap-1"
                                                    >
                                                        <StopCircle size={12} /> Force End
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {sessions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No sessions found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// Helper Components
const StatCard = ({ label, value, icon, trend, isLive }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-all">
        {isLive && <span className="absolute top-2 right-2 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>}
        <div className="flex justify-between items-start mb-4">
            <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-emerald-50 transition-colors">{icon}</div>
        </div>
        <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
        {trend && <div className="text-xs font-bold text-emerald-600 mt-3 flex items-center gap-1 bg-emerald-50 w-fit px-2 py-1 rounded-md">{trend}</div>}
    </div>
);

// Icon component needed? Used lucide-react above.
import { BookOpen } from 'lucide-react';

export default AdminDashboard;
