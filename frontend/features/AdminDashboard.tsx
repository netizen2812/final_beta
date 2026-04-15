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
import ScholarQuranManager from './ScholarQuranManager';

import { APPLICATION_API_URL } from '../lib/api';

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
    const [analytics, setAnalytics] = useState<any>(null);
    const [aiLogs, setAiLogs] = useState<any[]>([]);
    const [tab, setTab] = useState<'overview' | 'users' | 'paid' | 'batches' | 'sessions' | 'ailogs'>('overview');
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [paidSearchQuery, setPaidSearchQuery] = useState('');
    const [paidTotalCount, setPaidTotalCount] = useState(0);

    
    // Pagination state
    const [userPage, setUserPage] = useState(1);
    const [userTotalPages, setUserTotalPages] = useState(1);
    const [batchPage, setBatchPage] = useState(1);
    const [batchTotalPages, setBatchTotalPages] = useState(1);
    const [paidPage, setPaidPage] = useState(1);
    const [paidTotalPages, setPaidTotalPages] = useState(1);
    const [sessionPage, setSessionPage] = useState(1);
    const [sessionTotalPages, setSessionTotalPages] = useState(1);

    // --- FETCH DATA ---
    const fetchData = async () => {
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };

            const statsRes = await axios.get(`${APPLICATION_API_URL}/api/admin/stats`, { headers });
            setStats(statsRes.data);

            const usersRes = await axios.get(`${APPLICATION_API_URL}/api/admin/users?page=${userPage}&limit=50`, { headers });
            setUsers(usersRes.data.users || []);
            setUserTotalPages(usersRes.data.pagination?.pages || 1);

            const batchesRes = await axios.get(`${APPLICATION_API_URL}/api/admin/batches?page=${batchPage}&limit=10`, { headers });
            setBatches(batchesRes.data.batches || []);
            setBatchTotalPages(batchesRes.data.pagination?.pages || 1);
            setError(null);
        } catch (err: any) {
            console.error("Fetch error", err);
            setError("Failed to load dashboard. Access Denied.");
        } finally {
            setLoading(false);
        }
    };

    const fetchBatches = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/batches?page=${batchPage}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBatches(res.data.batches || []);
            setBatchTotalPages(res.data.pagination?.pages || 1);
        } catch (e) {
            console.error("Batches error", e);
        }
    };

    const fetchSessions = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/sessions?page=${sessionPage}&limit=20`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSessions(res.data.sessions || []);
            setSessionTotalPages(res.data.pagination?.pages || 1);
        } catch (e) {
            console.error("Sessions error", e);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/analytics/metrics`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAnalytics(res.data);
        } catch (e) {
            console.error("Analytics fetch error", e);
        }
    };

    const fetchManagementData = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            const [bRes, sRes] = await Promise.all([
                axios.get(`${APPLICATION_API_URL}/api/admin/batches?page=${batchPage}&limit=20`, { headers }),
                axios.get(`${APPLICATION_API_URL}/api/admin/sessions?page=${sessionPage}&limit=20`, { headers })
            ]);
            setBatches(bRes.data.batches || []);
            setBatchTotalPages(bRes.data.pagination?.pages || 1);
            setSessions(sRes.data.sessions || []);
            setSessionTotalPages(sRes.data.pagination?.pages || 1);
        } catch (e) { 
            console.error("Management data error", e);
        } finally {
            setLoading(false);
        }
    };


    const fetchAiLogs = async () => {
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/ai-logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAiLogs(res.data);
        } catch (e) {
            console.error("Failed to fetch AI logs", e);
        }
    };

    const fetchPaidUsers = async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users?isPaid=true&page=${paidPage}&limit=50&q=${paidSearchQuery}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(res.data.users || []);
            setPaidTotalPages(res.data.pagination?.pages || 1);
            setPaidTotalCount(res.data.pagination?.total || 0);
        } catch (e) {
            console.error("Paid users error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        fetchAnalytics();
    }, []);

    useEffect(() => {
        // Clear data when switching tabs to prevent "flicker" of old data
        if (tab === 'users' || tab === 'paid') setUsers([]);
        
        if (tab === 'users') fetchData();
        if (tab === 'paid') fetchPaidUsers();
        if (tab === 'batches' || tab === 'sessions') fetchManagementData();
        if (tab === 'ailogs') fetchAiLogs();
    }, [tab, userPage, batchPage, paidPage, sessionPage, paidSearchQuery]);


    // --- ACTIONS ---
    const handleRoleUpdate = async (userId: string, newRole: string) => {
        if (!confirm(`Change role to ${newRole}?`)) return;
        try {
            const token = await getToken();
            await axios.patch(`${APPLICATION_API_URL}/api/admin/user/${userId}`, { role: newRole.toLowerCase() }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData(); // Refresh list
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to update role");
        }
    };

    // --- RENDER ---
    if (loading && !stats && !analytics) return <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800">Loading Dashboard...</div>;
    if (error && !users.length) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold">{error}</div>;

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
                        { id: 'paid', icon: UserCheck, label: 'Paid Users' },
                        { id: 'batches', icon: Layers, label: 'Batches' },
                        { id: 'sessions', icon: Calendar, label: 'Sessions' },
                        { id: 'ailogs', icon: MessageCircle, label: 'AI Logs' },
                    ].map(t => (
                        <button key={t.id} onClick={() => setTab(t.id as any)} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${tab === t.id ? 'bg-emerald-600' : 'hover:bg-white/10 text-emerald-200'}`}>
                            <t.icon size={16} /> {t.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8">

                {/* 🥇 TIER 1 — CORE PLATFORM HEALTH */}
                {tab === 'overview' && (
                    <>
                        <Section title="Platform Health (Real-time)" icon={<Activity size={18} />}>
                            {analytics ? (
                                <>
                                    <StatCard label="DAU (Last 24h)" value={analytics?.health?.dau || 0} trend="Active Users" />
                                    <StatCard label="WAU (Last 7d)" value={analytics?.health?.wau || 0} />
                                    <StatCard label="Engagement Rate" value={`${(analytics?.health?.engagementRate || 0).toFixed(1)}%`} trend="Total Platform" />
                                    <StatCard label="Avg Session Depth" value={(analytics?.engagement?.avgSessionDepth || 0).toFixed(2)} trend="Features / Session" />
                                </>
                            ) : (
                                <div className="col-span-4 p-6 bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 text-center">Loading Real-time Metrics...</div>
                            )}
                        </Section>

                        <Section title="Feature Engagement Distribution" icon={<Server size={18} />}>
                            {analytics?.engagement?.featureDistribution?.length > 0 ? (
                                analytics.engagement.featureDistribution.map((f: any) => (
                                    <StatCard key={f._id} label={f._id.toUpperCase()} value={f.count} icon={<Layers className="text-emerald-500" />} />
                                ))
                            ) : analytics ? (
                                <div className="col-span-4 py-10 text-center text-slate-400 font-medium bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                    No engagement data for the past 7 days.
                                </div>
                            ) : (
                                <div className="col-span-4 p-6 bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 text-center">Analysing Features...</div>
                            )}
                        </Section>

                        <Section title="Attention Distribution (Total Time)" icon={<Clock size={18} />}>
                            {analytics?.engagement?.timeSpentDistribution?.length > 0 ? (
                                analytics.engagement.timeSpentDistribution.map((f: any) => (
                                    <StatCard key={f._id} label={f._id.toUpperCase()} value={`${Math.round(f.totalTimeMs / 60000)}m`} trend="Total Focus Time" />
                                ))
                            ) : analytics ? (
                                <div className="col-span-4 py-10 text-center text-slate-400 font-medium bg-slate-100/50 rounded-xl border border-dashed border-slate-200">
                                    No attention metrics recorded.
                                </div>
                            ) : (
                                <div className="col-span-4 p-6 bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 text-center">Calculating Attention...</div>
                            )}
                        </Section>

                        {stats && (
                            <Section title="Historical Context" icon={<Database size={18} />}>
                                <StatCard label="D1 Retention" value={`${stats.startup.retention.d1}%`} />
                                <StatCard label="Messages / Week" value={stats.depth.msgsPerWeek} />
                                <StatCard label="Avg Sessions / Child" value={stats.learning.avgLessonsPerChild} />
                                <StatCard label="Parent DB Views" value={stats.learning.parentViews} />
                            </Section>
                        )}

                        {stats && stats.cumulative ? (
                            <Section title="Cumulative Platform Totals" icon={<TrendingUp size={18} />}>
                                <StatCard label="Total Unique Users" value={stats.cumulative.totalUsersExcludingChildren} />
                                <StatCard label="Total Users (incl. Children)" value={stats.cumulative.totalUsersIncludingChildren} />
                                <StatCard label="Total AI Questions" value={stats.cumulative.totalAiQuestions} />
                                <StatCard label="Avg Questions / User" value={stats.cumulative.avgQuestionsPerUser} />
                                <StatCard label="Ibadah Usage" value={stats.cumulative.totalIbadahUsage} />
                                <StatCard label="Total Sessions" value={stats.cumulative.totalLessonsTarbiyah} />
                                <StatCard label="3+ Days Active Users" value={stats.cumulative.usersWithThreeDays} />
                            </Section>
                        ) : stats ? (
                            <div className="col-span-4 p-6 bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 text-center">
                                Calculating Platform Totals...
                            </div>
                        ) : null}
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
                                                                    {child.age} yrs • {child.gender === 'Boy' ? 'Boy' : 'Girl'}
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
                        
                        <PaginationControls 
                            currentPage={userPage} 
                            totalPages={userTotalPages} 
                            onPageChange={setUserPage} 
                        />
                    </div>
                )}

                {/* 💳 PART 2.5 — PAID USERS */}
                {tab === 'paid' && (
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 overflow-hidden">
                        <div className="p-6 border-b border-emerald-100 flex justify-between items-center bg-emerald-50">
                            <div>
                                <h2 className="font-bold text-lg text-emerald-900 flex items-center gap-2">
                                    <UserCheck size={20} className="text-emerald-600" /> Premium / Paid Users
                                </h2>
                                <p className="text-xs text-emerald-600 font-medium">Users with active Live Tarbiyah or AI subscriptions</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <input 
                                    className="border border-emerald-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none w-64" 
                                    placeholder="Search premium users..." 
                                    value={paidSearchQuery} 
                                    onChange={e => setPaidSearchQuery(e.target.value)} 
                                />
                                <div className="bg-[#052e16] text-white font-bold px-4 py-2 rounded-xl text-sm shadow-lg shadow-emerald-900/20 whitespace-nowrap">
                                    Total Premium: {paidTotalCount}
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">User</th>
                                        <th className="px-6 py-4">Plan Status</th>
                                        <th className="px-6 py-4">Payment Ref</th>
                                        <th className="px-6 py-4">Current Role</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {users.length > 0 ? users.map(u => {
                                        const hasLive = u.features?.liveAccess === true;
                                        const aiUntil = u.features?.aiPremiumUntil ? new Date(u.features.aiPremiumUntil) : null;
                                        const hasAi = aiUntil && aiUntil > new Date();
                                        const lastPayment = u.processedPayments?.[u.processedPayments.length - 1];

                                        return (
                                            <tr key={u._id} className="hover:bg-slate-50 transition-colors group">
                                                <td className="px-6 py-4 align-top">
                                                    <div className="font-bold text-slate-800">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                    <div className="text-[10px] font-mono text-slate-300 mt-1">{u._id}</div>
                                                </td>
                                                <td className="px-6 py-4 align-top space-y-2">
                                                    {hasLive ? (
                                                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-[11px] font-black uppercase tracking-tight w-max group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                            <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:bg-white animate-pulse" />
                                                            Live Tarbiyah
                                                        </div>
                                                    ) : (
                                                       <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">No Live Access</div>
                                                    )}
                                                    {hasAi && (
                                                        <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-700 px-3 py-1.5 rounded-xl border border-indigo-500/20 text-[11px] font-black uppercase tracking-tight w-max group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                            <MessageCircle size={14} /> AI Until {aiUntil.toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    {lastPayment ? (
                                                        <div className="space-y-1">
                                                            <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Razorpay</div>
                                                            <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{lastPayment}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                Manual / Admin
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 italic">No payment record found</div>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 align-top">
                                                    <span className={`px-3 py-1 rounded-lg uppercase font-black text-[9px] tracking-widest shadow-sm ${
                                                        u.role === 'admin' ? 'bg-rose-500 text-white' :
                                                        u.role === 'scholar' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                        {u.role || 'parent'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-slate-400 italic">
                                                No premium users found in the system yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            
                            <PaginationControls 
                                currentPage={paidPage} 
                                totalPages={paidTotalPages} 
                                onPageChange={setPaidPage} 
                            />
                        </div>
                    </div>
                )}

                {/* 💬 PART 3 — AI CONVERSATION LOGS */}
                {tab === 'ailogs' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-lg flex items-center gap-2"><MessageCircle size={20} className="text-emerald-600" /> Recent AI Conversations</h2>
                            <div className="text-xs text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-inner">Showing last 50 conversations</div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 w-1/4">User Info</th>
                                        <th className="px-6 py-4 w-1/3">Question</th>
                                        <th className="px-6 py-4 w-1/3">AI Response</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {aiLogs.length > 0 ? aiLogs.map(log => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-slate-800 flex items-center gap-2">
                                                    {log.userName}
                                                    {log.userRole === 'scholar' && <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Scholar</span>}
                                                    {log.userRole === 'admin' && <span className="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Admin</span>}
                                                </div>
                                                <div className="text-[11px] text-slate-500 mt-1">{log.userEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-slate-700 font-medium bg-slate-100 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
                                                    "{log.question}"
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top">
                                                <div className="text-slate-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100/50 leading-relaxed max-h-32 overflow-y-auto custom-scrollbar">
                                                    {log.answer}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-xs text-slate-500 whitespace-nowrap">
                                                {new Date(log.timestamp).toLocaleString(undefined, {
                                                    month: 'short', day: 'numeric',
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                                No AI conversations recorded recently.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 📦 PART 4 — BATCH & SESSION MANAGEMENT */}
                {tab === 'batches' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Layers size={20} className="text-emerald-600" /> Active Batches</h2>
                            <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"><Plus size={14} /> New Batch</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Batch Name</th>
                                        <th className="px-6 py-4">Scholar</th>
                                        <th className="px-6 py-4">Level</th>
                                        <th className="px-6 py-4">Schedule</th>
                                        <th className="px-6 py-4">Students</th>
                                        <th className="px-6 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {batches.length > 0 ? batches.map(b => (
                                        <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 align-top">
                                                <div className="font-bold text-slate-800">{b.name}</div>
                                                <div className="text-[10px] font-mono text-slate-300 mt-1">{b._id}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-slate-600">{b.scholar?.name || 'Unassigned'}</td>
                                            <td className="px-6 py-4 align-top">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                    b.level === 'Advanced' ? 'bg-purple-100 text-purple-700' :
                                                    b.level === 'Intermediate' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {b.level || 'Beginner'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 align-top text-xs text-slate-500">
                                                {b.schedule?.days?.join(', ') || 'No days'}
                                                <div className="mt-1 font-mono text-[10px]">{b.schedule?.time || 'No time'}</div>
                                            </td>
                                            <td className="px-6 py-4 align-top text-slate-500">{b.students?.length || 0} enrolled</td>
                                            <td className="px-6 py-4 align-top">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                    b.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                                    b.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {b.status || 'Active'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 italic">No batches found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls currentPage={batchPage} totalPages={batchTotalPages} onPageChange={setBatchPage} />
                    </div>
                )}

                {tab === 'sessions' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h2 className="font-bold text-lg flex items-center gap-2"><Video size={20} className="text-emerald-600" /> Academic Sessions</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Session Date</th>
                                        <th className="px-6 py-4">Batch</th>
                                        <th className="px-6 py-4">Scholar</th>
                                        <th className="px-6 py-4">Type</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {sessions.length > 0 ? sessions.map(s => (
                                        <tr key={s._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">
                                                {new Date(s.scheduledAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-slate-800">{s.batchId?.name || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-slate-600">{s.scholarId?.name || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">{s.type || 'Lecture'}</span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={4} className="px-6 py-10 text-center text-slate-400 italic">No historical sessions recorded.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <PaginationControls currentPage={sessionPage} totalPages={sessionTotalPages} onPageChange={setSessionPage} />
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

const PaginationControls = ({ currentPage, totalPages, onPageChange }: any) => {
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-center items-center gap-4 py-6 bg-slate-50/50 border-t border-slate-100">
            <button 
                disabled={currentPage === 1} 
                onClick={() => onPageChange(currentPage - 1)}
                className="px-4 py-2 border rounded-lg font-bold disabled:opacity-30 bg-white shadow-sm hover:bg-slate-50 transition-colors"
            >
                Previous
            </button>
            <span className="font-mono text-sm font-bold text-slate-500">
                Page <span className="text-emerald-600">{currentPage}</span> / {totalPages}
            </span>
            <button 
                disabled={currentPage === totalPages} 
                onClick={() => onPageChange(currentPage + 1)}
                className="px-4 py-2 border rounded-lg font-bold disabled:opacity-30 bg-white shadow-sm hover:bg-slate-50 transition-colors"
            >
                Next
            </button>
        </div>
    );
};

export default AdminDashboard;
