import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
    Users, Activity, Video, BarChart2, Shield,
    RefreshCw, TrendingUp, UserCheck, AlertTriangle,
    Play, StopCircle, Lock, Unlock, Server, Database, Search,
    Radio, Calendar, Layers, ChevronDown, ChevronRight, Plus,
    Clock, MessageCircle, BookOpen, Heart
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
    const [users, setUsers] = useState<any[]>([]);
    const [batches, setBatches] = useState<any[]>([]);
    const [sessions, setSessions] = useState<any[]>([]);
    const [tab, setTab] = useState<'overview' | 'users' | 'batches' | 'sessions'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const statsRes = await axios.get(`${API_BASE}/api/admin/stats`, { headers });
            setStats(statsRes.data);

            const usersRes = await axios.get(`${API_BASE}/api/admin/users`, { headers });
            setUsers(usersRes.data);

            // Fetch batches/sessions if in management mode
            // For now lazy load them.
            setError(null);
        } catch (err: any) {
            console.error("Fetch error", err);
            setError("Failed to load dashboard. Access Denied.");
        } finally { setLoading(false); }
    };

    const fetchManagementData = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [b, s] = await Promise.all([
                axios.get(`${API_BASE}/api/admin/batches`, { headers }),
                axios.get(`${API_BASE}/api/admin/sessions`, { headers })
            ]);
            setBatches(b.data);
            setSessions(s.data);
        } catch (e) { }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (tab === 'batches' || tab === 'sessions') fetchManagementData();
    }, [tab]);

    // --- ACTIONS ---
    const handleRoleUpdate = async (userId: string, newRole: string) => {
        if (!confirm(`Change role to ${newRole}?`)) return;
        try {
            const token = await getToken();
            await axios.patch(`${API_BASE}/api/admin/user/${userId}`, { role: newRole.toLowerCase() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update role");
        }
    };

    // --- RENDER ---
    if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800">Loading Analytics...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">{error}</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-[#022c22] text-white p-6 sticky top-0 z-50 shadow-xl flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-500 p-2 rounded-lg"><Shield size={24} className="text-[#022c22]" /></div>
                    <div>
                        <h1 className="text-xl font-bold font-serif tracking-wide">Imam Admin</h1>
                        <p className="text-xs text-emerald-400 font-mono">REAL-TIME ANALYTICS</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={onNavigateToLive} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg transition-all">
                        <Video size={16} /> Live Admin
                    </button>
                    {[
                        { id: 'overview', icon: BarChart2, label: 'Analytics' },
                        { id: 'users', icon: Users, label: 'User Roles' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === t.id ? 'bg-emerald-600' : 'hover:bg-white/10 text-emerald-200'}`}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

                {/* 🥇 TIER 1 — CORE STARTUP HEALTH */}
                {tab === 'overview' && stats && (
                    <>
                        <Section title="Startup Health (Retention & Active)" icon={<Activity size={18} />}>
                            <StatCard label="D1 Retention" value={`${stats.startup.retention.d1}%`} trend="vs yesterday" />
                            <StatCard label="DAU (Daily Active)" value={stats.startup.active.dau} />
                            <StatCard label="WAU (Weekly Active)" value={stats.startup.active.wau} />
                            <StatCard label="Day 30 Retention" value={`${stats.startup.retention.d30}%`} />
                        </Section>

                        <Section title="Habit Formation" icon={<Clock size={18} />}>
                            <StatCard label="Avg Active Days/Wk" value={stats.startup.habit.avgActiveDays} />
                            <StatCard label="Habit Formed (>3 days)" value={`${stats.startup.habit.habitPercent}%`} trend="of Active Users" />
                        </Section>

                        <Section title="Feature Engagement (% of Active Users)" icon={<Server size={18} />}>
                            <StatCard label="Using Chat" value={`${stats.features.chat}%`} icon={<MessageCircle className="text-blue-500" />} />
                            <StatCard label="Learning Tarbiyah" value={`${stats.features.tarbiyah}%`} icon={<BookOpen className="text-emerald-500" />} />
                            <StatCard label="Attending Live" value={`${stats.features.live}%`} icon={<Video className="text-red-500" />} />
                        </Section>

                        {/* 🧒 TIER 2 — PARENT + CHILD */}
                        <Section title="Learning & Impact" icon={<Heart size={18} />}>
                            <StatCard label="Messages / Week" value={stats.depth.msgsPerWeek} />
                            <StatCard label="Avg Lessons / Child" value={stats.learning.avgLessonsPerChild} />
                            <StatCard label="Parent DB Views" value={stats.learning.parentViews} />
                        </Section>

                        {/* 🚨 TIER 3 — RISK */}
                        <Section title="Risk Alerts" icon={<AlertTriangle size={18} className="text-amber-500" />}>
                            <StatCard label="Inactive Children (>7d)" value={stats.risk.inactiveChildren} trend="Candidates for Churn" icon={<UserCheck className="text-red-500" />} />
                            <StatCard label="Incomplete Lessons" value={stats.risk.incompleteLessons} />
                        </Section>
                    </>
                )}

                {/* 🧩 PART 2 — USER DASHBOARD ROLE MANAGEMENT */}
                {tab === 'users' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between">
                            <h2 className="font-bold text-lg">User Role Manager</h2>
                            <input className="border rounded px-3 py-1 text-sm bg-slate-50" placeholder="Search users..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Children Branch</th>
                                    <th className="px-6 py-4">Role Control</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.filter(u => u.email?.includes(searchQuery)).map(u => (
                                    <tr key={u._id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 align-top">
                                            <div className="font-bold text-slate-800">{u.name}</div>
                                            <div className="text-xs text-slate-500">{u.email}</div>
                                            <div className="text-[10px] font-mono text-slate-300 mt-1">{u._id}</div>
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            {u.children && u.children.length > 0 ? (
                                                <div className="space-y-2">
                                                    {u.children.map((child: any) => (
                                                        <div key={child._id} className="flex items-center gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                                {child.name?.[0] || 'C'}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-bold text-slate-700">{child.name}</div>
                                                                <div className="text-[10px] text-slate-400">
                                                                    {child.age} yrs • {child.gender === 'male' ? 'Boy' : 'Girl'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">No registered children</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 align-top">
                                            <select
                                                value={u.role || 'parent'}
                                                onChange={(e) => handleRoleUpdate(u._id, e.target.value)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase cursor-pointer border-none ring-1 ring-slate-200 focus:ring-emerald-500 ${u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                    u.role === 'scholar' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                <option value="parent">Parent</option>
                                                <option value="scholar">Scholar</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Placeholder for Batches/Sessions (Previously Implemented) */}
                {(tab === 'batches' || tab === 'sessions') && (
                    <div className="p-10 text-center text-slate-400 bg-slate-50 border-dashed border-2 rounded-xl">
                        Batch/Session Management Active (Refer to previous implementation)
                    </div>
                )}

            </div>
        </div>
    );
};

// Helper Components
const Section = ({ title, icon, children }: any) => (
    <div>
        <h2 className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">{icon} {title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {children}
        </div>
    </div>
);

const StatCard = ({ label, value, trend, icon }: any) => (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden h-full flex flex-col justify-between">
        <div>
            <div className="flex justify-between items-start">
                <div className="text-3xl font-bold text-slate-800 mb-1">{value}</div>
                {icon && <div className="opacity-20">{icon}</div>}
            </div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</div>
        </div>
        {trend && <div className="text-xs font-bold text-emerald-600 mt-2 bg-emerald-50 w-fit px-2 py-1 rounded">{trend}</div>}
    </div>
);

export default AdminDashboard;
