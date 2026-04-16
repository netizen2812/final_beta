import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import axios from 'axios';
import {
    Users, Activity, Video, BarChart2, Shield,
    RefreshCw, TrendingUp, UserCheck, AlertTriangle,
    Play, StopCircle, Lock, Unlock, Server, Database, Search,
    Radio, Calendar, Layers, ChevronDown, ChevronRight, Plus,
    Clock, MessageCircle, BookOpen, Heart, CheckCircle
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
    const [paidSource, setPaidSource] = useState<'all' | 'razorpay' | 'manual'>('all');
    const [editingPaymentUserId, setEditingPaymentUserId] = useState<string | null>(null);
    const [manualPaymentId, setManualPaymentId] = useState('');
    const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

    // Batch Management State
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<any>(null);
    const [savingBatch, setSavingBatch] = useState(false);
    
    // Scholar Search State
    const [scholarSearchQuery, setScholarSearchQuery] = useState('');
    const [scholarResults, setScholarResults] = useState<any[]>([]);
    const [isSearchingScholars, setIsSearchingScholars] = useState(false);
    const [selectedScholar, setSelectedScholar] = useState<any>(null);

    
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
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users?isPaid=true&page=${paidPage}&limit=50&q=${paidSearchQuery}&source=${paidSource}`, {
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
    }, [tab, userPage, batchPage, paidPage, sessionPage, paidSearchQuery, paidSource]);


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

    const handleUpdatePaymentRef = async (userId: string) => {
        if (!manualPaymentId.trim()) return;
        setIsUpdatingPayment(true);
        try {
            const token = await getToken();
            await axios.patch(`${APPLICATION_API_URL}/api/admin/user/${userId}`, {
                paymentId: manualPaymentId.trim()
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEditingPaymentUserId(null);
            setManualPaymentId('');
            fetchPaidUsers(); // Refresh the list
        } catch (e) {
            alert("Failed to update payment reference");
        } finally {
            setIsUpdatingPayment(false);
        }
    };

    const searchScholars = async (query: string) => {
        setScholarSearchQuery(query);
        if (query.trim().length === 0) {
            setScholarResults([]);
            return;
        }
        setIsSearchingScholars(true);
        try {
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users?role=scholar&q=${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScholarResults(res.data.users || []);
        } catch (e) {
            console.error("Scholar search error", e);
        } finally {
            setIsSearchingScholars(false);
        }
    };

    const handleSaveBatch = async (batchData: any) => {
        setSavingBatch(true);
        try {
            const token = await getToken();
            const headers = { Authorization: `Bearer ${token}` };
            
            if (editingBatch) {
                await axios.patch(`${APPLICATION_API_URL}/api/admin/batches/${editingBatch._id}`, batchData, { headers });
            } else {
                await axios.post(`${APPLICATION_API_URL}/api/admin/batches`, batchData, { headers });
            }
            
            setIsBatchModalOpen(false);
            setEditingBatch(null);
            setSelectedScholar(null);
            fetchBatches();
        } catch (e) {
            alert("Failed to save batch");
        } finally {
            setSavingBatch(false);
        }
    };

    const handleDeleteBatch = async (batchId: string) => {
        if (!confirm("Are you sure you want to delete this batch? All history will be lost.")) return;
        try {
            const token = await getToken();
            await axios.delete(`${APPLICATION_API_URL}/api/admin/batches/${batchId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchBatches();
        } catch (e) {
            alert("Failed to delete batch");
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
                                <select 
                                    className="border border-emerald-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-emerald-400 outline-none"
                                    value={paidSource}
                                    onChange={(e) => setPaidSource(e.target.value as any)}
                                >
                                    <option value="all">All Sources</option>
                                    <option value="razorpay">Razorpay Only</option>
                                    <option value="manual">Manual / Admin</option>
                                </select>
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
                                                    {editingPaymentUserId === u._id ? (
                                                        <div className="flex flex-col gap-2">
                                                            <input 
                                                                type="text" 
                                                                value={manualPaymentId}
                                                                onChange={(e) => setManualPaymentId(e.target.value)}
                                                                placeholder="pay_..."
                                                                className="text-[10px] font-mono border-2 border-emerald-500 rounded px-2 py-1 outline-none w-full"
                                                                autoFocus
                                                            />
                                                            <div className="flex gap-2">
                                                                <button 
                                                                    onClick={() => handleUpdatePaymentRef(u._id)}
                                                                    disabled={isUpdatingPayment}
                                                                    className="bg-emerald-500 text-white text-[9px] font-black px-2 py-1 rounded uppercase hover:bg-emerald-600 disabled:opacity-50"
                                                                >
                                                                    {isUpdatingPayment ? 'Saving...' : 'Save'}
                                                                </button>
                                                                <button 
                                                                    onClick={() => { setEditingPaymentUserId(null); setManualPaymentId(''); }}
                                                                    className="bg-slate-200 text-slate-500 text-[9px] font-black px-2 py-1 rounded uppercase hover:bg-slate-300"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {lastPayment ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Razorpay</div>
                                                                        <button 
                                                                            onClick={() => { setEditingPaymentUserId(u._id); setManualPaymentId(lastPayment); }}
                                                                            className="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            Edit
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{lastPayment}</div>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="text-[11px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-1">
                                                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                            Manual / Admin
                                                                        </div>
                                                                        <button 
                                                                            onClick={() => { setEditingPaymentUserId(u._id); setManualPaymentId(''); }}
                                                                            className="text-[10px] text-emerald-500 hover:text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        >
                                                                            Add Ref
                                                                        </button>
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 italic">No payment record found</div>
                                                                </div>
                                                            )}
                                                        </>
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
                            <h2 className="font-bold text-lg flex items-center gap-2"><MessageCircle size={20} className="text-emerald-600" /> AI Conversation Logs</h2>
                            <button onClick={fetchAiLogs} className="p-2 hover:bg-slate-200 rounded-lg transition-colors"><RefreshCw size={18} /></button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Timestamp</th>
                                        <th className="px-6 py-4">Subject</th>
                                        <th className="px-6 py-4">Scholar / Parent</th>
                                        <th className="px-6 py-4">Preview</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {aiLogs.length > 0 ? aiLogs.map(log => (
                                        <tr key={log._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 font-mono text-[10px] text-slate-500">{new Date(log.createdAt).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{log.subject || 'Conversation'}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-bold text-slate-800">{log.userName || 'Unknown'}</div>
                                                <div className="text-[10px] text-slate-400 capitalize">{log.role || 'User'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 italic max-w-md truncate">
                                                {log.messages?.[log.messages.length - 1]?.content || 'Empty history'}
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
                            <button 
                                onClick={() => { setEditingBatch(null); setSelectedScholar(null); setIsBatchModalOpen(true); }}
                                className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2"
                            >
                                <Plus size={14} /> New Batch
                            </button>
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
                                        <th className="px-6 py-4 text-right">Actions</th>
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
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => { setEditingBatch(b); setSelectedScholar(b.scholar); setIsBatchModalOpen(true); }}
                                                        className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
                                                        title="Edit Batch"
                                                    >
                                                        <Activity size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteBatch(b._id)}
                                                        className="p-1 hover:bg-red-50 text-red-600 rounded transition-colors"
                                                        title="Delete Batch"
                                                    >
                                                        <AlertTriangle size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-400 italic">No batches found.</td></tr>
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

            {/* 🛠️ BATCH MANAGEMENT MODAL */}
            {isBatchModalOpen && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{editingBatch ? 'Edit Batch' : 'Create New Batch'}</h3>
                                <p className="text-xs text-slate-500 font-medium">Manage course details and scholar assignments</p>
                            </div>
                            <button onClick={() => setIsBatchModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><Plus size={24} className="rotate-45 text-slate-400" /></button>
                        </div>
                        
                        <BatchForm 
                            initialData={editingBatch}
                            selectedScholar={selectedScholar}
                            onSave={handleSaveBatch}
                            onCancel={() => setIsBatchModalOpen(false)}
                            searchScholars={searchScholars}
                            scholarResults={scholarResults}
                            isSearchingScholars={isSearchingScholars}
                            saving={savingBatch}
                            getToken={getToken}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- SUBSIDIARY COMPONENTS ---

const BatchForm = ({ initialData, selectedScholar: initialScholar, onSave, onCancel, searchScholars, scholarResults, isSearchingScholars, saving, getToken }: any) => {
    const [name, setName] = useState(initialData?.name || '');
    const [level, setLevel] = useState(initialData?.level || 'Beginner');
    const [status, setStatus] = useState(initialData?.status || 'upcoming');
    const [days, setDays] = useState<string[]>(initialData?.schedule?.days || []);
    const [time, setTime] = useState(initialData?.schedule?.time || '18:00 UTC');
    const [selectedScholar, setSelectedScholar] = useState<any>(initialScholar || null);
    const [showScholarResults, setShowScholarResults] = useState(false);
    
    // Student Management State
    const [activeTab, setActiveTab] = useState<'settings' | 'students'>('settings');
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>(initialData?.students || []);
    const [studentSearch, setStudentSearch] = useState('');
    const [studentResults, setStudentResults] = useState<any[]>([]);
    const [isSearchingStudents, setIsSearchingStudents] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    useEffect(() => {
        if (initialData?._id && activeTab === 'students') {
            fetchEnrolledStudents();
        }
    }, [activeTab, initialData?._id]);

    const fetchEnrolledStudents = async () => {
        try {
            setIsLoadingStudents(true);
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${initialData._id}/students`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrolledStudents(res.data);
        } catch (err) {
            console.error("Fetch enrolled students error", err);
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleSearchStudents = async (query: string) => {
        setStudentSearch(query);
        if (query.length < 2) {
            setStudentResults([]);
            return;
        }
        try {
            setIsSearchingStudents(true);
            const token = await getToken();
            const res = await axios.get(`${APPLICATION_API_URL}/api/admin/users?q=${query}&limit=10`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStudentResults(res.data.users || []);
        } catch (err) {
            console.error("Student search error", err);
        } finally {
            setIsSearchingStudents(false);
        }
    };

    const handleAddStudent = async (id: string) => {
        try {
            const token = await getToken();
            const res = await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch/${initialData._id}/add-student`, { childId: id }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert("Student enrolled successfully!");
            setStudentSearch('');
            setStudentResults([]);
            fetchEnrolledStudents();
        } catch (err) {
            console.error("Add student error", err);
            alert("Failed to enroll student.");
        }
    };

    const handleRemoveStudent = async (childId: string) => {
        if (!confirm("Are you sure you want to remove this student?")) return;
        try {
            const token = await getToken();
            await axios.post(`${APPLICATION_API_URL}/api/live/admin/batch/${initialData._id}/remove-student`, { childId }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEnrolledStudents(prev => prev.filter(s => s._id !== childId));
        } catch (err) {
            console.error("Remove student error", err);
            alert("Failed to remove student.");
        }
    };

    const toggleDay = (day: string) => {
        setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        if (!selectedScholar) return alert("Please select a scholar");
        onSave({
            name,
            level,
            status,
            scholar: selectedScholar._id,
            scholarEmail: selectedScholar.email,
            schedule: { days, time }
        });
    };

    const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Modal Tabs */}
            <div className="flex bg-slate-100/50 p-1 mx-8 mt-4 rounded-xl">
               <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
               >
                 General Settings
               </button>
               {initialData?._id && (
                  <button 
                  onClick={() => setActiveTab('students')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'students' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
                  >
                    Enrolled Students ({enrolledStudents.length})
                  </button>
               )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[70vh]">
                {activeTab === 'settings' ? (
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch Name</span>
                                    <input 
                                        required 
                                        type="text" 
                                        className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50" 
                                        placeholder="e.g. Quran Beginners A"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    <label className="block">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Default Level</span>
                                        <select 
                                            className="mt-1 block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50"
                                            value={level}
                                            onChange={e => setLevel(e.target.value)}
                                        >
                                            <option>Beginner</option>
                                            <option>Intermediate</option>
                                            <option>Advanced</option>
                                        </select>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-4">
                               <div className="relative">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Scholar</span>
                                    {selectedScholar ? (
                                        <div className="mt-1 flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                            <div>
                                                <div className="text-sm font-bold text-emerald-900">{selectedScholar.name}</div>
                                                <div className="text-[10px] text-emerald-600">{selectedScholar.email}</div>
                                            </div>
                                            <button type="button" onClick={() => setSelectedScholar(null)} className="text-emerald-400 hover:text-red-500"><Plus size={18} className="rotate-45" /></button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                            <input 
                                                type="text" 
                                                className="mt-1 block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50" 
                                                placeholder="Search by name or email..."
                                                onFocus={() => setShowScholarResults(true)}
                                                onChange={e => {
                                                    searchScholars(e.target.value);
                                                    setShowScholarResults(true);
                                                }}
                                            />
                                            {showScholarResults && scholarResults.length > 0 && (
                                                <div className="absolute z-[110] left-0 right-0 mt-2 bg-white border border-slate-100 shadow-2xl rounded-2xl max-h-48 overflow-y-auto">
                                                    {scholarResults.map((s: any) => (
                                                        <button 
                                                            key={s._id}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedScholar(s);
                                                                setShowScholarResults(false);
                                                            }}
                                                            className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 flex flex-col"
                                                        >
                                                            <span className="text-sm font-bold text-slate-800">{s.name}</span>
                                                            <span className="text-[10px] text-slate-400">{s.email}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {isSearchingScholars && (
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    <RefreshCw size={14} className="animate-spin text-slate-300" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                               </div>
                               <label className="block">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Time</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock size={16} className="text-slate-400" />
                                        <input 
                                            required 
                                            type="text" 
                                            className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50" 
                                            placeholder="e.g. 18:00 UTC"
                                            value={time}
                                            onChange={e => setTime(e.target.value)}
                                        />
                                    </div>
                               </label>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scheduled Days</span>
                            <div className="flex flex-wrap gap-2">
                                {ALL_DAYS.map(day => (
                                    <button 
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            days.includes(day) 
                                                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' 
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        {day.slice(0, 3)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button 
                                type="button" 
                                onClick={onCancel}
                                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-4 rounded-2xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={saving}
                                className="flex-1 bg-[#022c22] hover:bg-emerald-900 text-white py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                                {initialData ? 'Update Batch' : 'Create Batch'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-8 space-y-6">
                        {/* 🔎 SEARCH & ADD SECTION */}
                        <div className="space-y-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enroll New Student / Parent</span>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    className="block w-full pl-10 rounded-xl border-slate-200 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-3 bg-slate-50" 
                                    placeholder="Search by Parent Email or Child Name..."
                                    value={studentSearch}
                                    onChange={e => handleSearchStudents(e.target.value)}
                                />
                                {isSearchingStudents && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <RefreshCw size={14} className="animate-spin text-slate-300" />
                                    </div>
                                )}
                            </div>

                            {studentResults.length > 0 && (
                                <div className="mt-2 bg-white border border-slate-100 shadow-lg rounded-2xl overflow-hidden divide-y divide-slate-50">
                                    {studentResults.map(u => (
                                        <div key={u._id} className="p-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{u.name}</div>
                                                    <div className="text-[10px] text-slate-400">{u.email}</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {/* Option 1: Enroll the Parent Directly (Frictionless) */}
                                                    <button 
                                                        onClick={() => handleAddStudent(u._id)}
                                                        className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg hover:bg-emerald-200 transition-colors"
                                                    >
                                                        Enroll Parent
                                                    </button>
                                                    {/* Option 2: Enroll Children if they exist */}
                                                    {u.children?.map((c: any) => (
                                                        <button 
                                                            key={c._id}
                                                            onClick={() => handleAddStudent(c._id)}
                                                            className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg hover:bg-blue-200 transition-colors"
                                                        >
                                                            Enroll {c.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 📋 CURRENT STUDENTS LIST */}
                        <div className="space-y-4 pt-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Currently Enrolled</h4>
                            {isLoadingStudents ? (
                                <div className="flex justify-center p-8"><RefreshCw className="animate-spin text-slate-300" /></div>
                            ) : enrolledStudents.length > 0 ? (
                                <div className="space-y-2">
                                    {enrolledStudents.map(s => (
                                        <div key={s._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                    {s.name?.[0] || 'S'}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-800">{s.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{s._id}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveStudent(s._id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                                            >
                                                <Plus size={18} className="rotate-45" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 italic text-sm">No students enrolled in this batch yet.</div>
                            )}
                        </div>
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
