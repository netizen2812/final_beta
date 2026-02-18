import React, { useState, useEffect } from 'react';
import {
  Clock, TrendingUp, CheckCircle, Award, BarChart2, Settings,
  Loader2, ChevronDown, Save
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip
} from 'recharts';
import { useChildContext } from '../contexts/ChildContext';
import { tarbiyahService, ParentDashboardData } from '../services/tarbiyahService';
import { useAuth } from '@clerk/clerk-react';



const ParentDashboard: React.FC = () => {
  const { children, loading: childrenLoading } = useChildContext();
  const { getToken } = useAuth();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Settings state
  const [dailyLimit, setDailyLimit] = useState(45);
  const [savingSettings, setSavingSettings] = useState(false);

  // Select first child by default
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children, selectedChildId]);

  // Fetch dashboard data when child is selected
  useEffect(() => {
    if (selectedChildId) {
      fetchDashboard(selectedChildId);
    }
  }, [selectedChildId]);

  const fetchDashboard = async (childId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await tarbiyahService.getParentDashboard(childId, getToken);
      setDashboardData(data);

      // Update settings state
      setDailyLimit(data.settings.dailyLimitMinutes);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedChildId) return;

    setSavingSettings(true);
    try {
      await tarbiyahService.updateParentSettings(selectedChildId, {
        dailyLimitMinutes: dailyLimit
      }, getToken);

      // Refresh dashboard
      await fetchDashboard(selectedChildId);
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const selectedChild = children.find(c => c.id === selectedChildId);

  if (childrenLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="animate-spin text-[#052e16]" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Dashboard...</p>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
            <BarChart2 className="text-slate-400" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Children Added</h3>
          <p className="text-slate-500">Add a child profile to view Tarbiyah analytics</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const topicData = dashboardData ? dashboardData.topicBreakdown : [];

  const activityData = dashboardData ? dashboardData.activityLog.days.map((day, idx) => ({
    day,
    min: dashboardData.activityLog.minutes[idx]
  })) : [];

  return (
    <div className="min-h-screen pb-20 space-y-8">
      {/* Header with Child Selector */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-[#052e16] border border-emerald-100 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <BarChart2 size={12} /> Tarbiyah Analytics
          </div>
          <h1 className="text-3xl font-serif font-bold text-[#052e16]">Parent Dashboard</h1>
          <p className="text-slate-500 mt-2">Monitor your child's Islamic learning journey</p>
        </div>

        {/* Child Selector */}
        <div className="relative">
          <select
            value={selectedChildId || ''}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="appearance-none bg-white border-2 border-slate-200 rounded-2xl px-6 py-3 pr-12 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#052e16] focus:ring-4 focus:ring-[#052e16]/10 transition-all"
          >
            {children.map(child => (
              <option key={child.id} value={child.id}>{child.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#052e16]" size={40} />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={() => selectedChildId && fetchDashboard(selectedChildId)}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && !error && dashboardData && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Time This Week */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Clock className="text-[#052e16]" size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Time This Week</p>
                  <p className="text-2xl font-bold text-slate-800">{dashboardData.timeThisWeek.total}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`font-bold ${dashboardData.timeThisWeek.percentChange.startsWith('+') ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dashboardData.timeThisWeek.percentChange}
                </span>
                <span className="text-slate-400">{dashboardData.timeThisWeek.comparisonText}</span>
              </div>
            </div>

            {/* Lessons Done */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <CheckCircle className="text-blue-600" size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Lessons Done</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {dashboardData.lessonsDone.completed}/{dashboardData.lessonsDone.total}
                  </p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                {dashboardData.lessonsDone.inProgress} in progress
              </div>
            </div>

            {/* Current Focus */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-amber-600" size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Current Focus</p>
                  <p className="text-sm font-bold text-slate-800">{dashboardData.currentFocus.progress}</p>
                </div>
              </div>
              <div className="text-xs text-slate-600 font-medium truncate">
                {dashboardData.currentFocus.lessonTitle}
              </div>
            </div>

            {/* Total Badges */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Award className="text-purple-600" size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Badges</p>
                  <p className="text-2xl font-bold text-slate-800">{dashboardData.totalBadges.count}</p>
                </div>
              </div>
              <div className="text-xs text-slate-500">
                Earned from completed lessons
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Topic Breakdown */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm mb-6">Topic Breakdown</h3>
              {topicData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topicData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {topicData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {topicData.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                        <span className="text-xs text-slate-600 font-medium">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400">
                  <p className="text-sm">No data yet</p>
                </div>
              )}
            </div>

            {/* Activity Log */}
            <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-sm">Weekly Activity</h3>
                <span className="text-[10px] bg-slate-50 border border-slate-200 rounded-lg py-1 px-3 text-[#052e16] font-bold">
                  Last 7 Days
                </span>
              </div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activityData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="min" fill="#10b981" radius={[8, 8, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Settings & Controls */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Settings className="text-[#052e16]" size={24} />
                <h3 className="font-bold text-slate-800 text-lg">Daily Limit Settings</h3>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs font-bold text-[#052e16] hover:text-emerald-700 transition-colors"
              >
                {showSettings ? 'Hide' : 'Show'}
              </button>
            </div>

            {showSettings && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Daily Limit */}
                <div>
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 block">
                    Daily Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(parseInt(e.target.value) || 0)}
                    className="w-full md:w-48 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#052e16] focus:ring-4 focus:ring-[#052e16]/10 transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-2">Set the maximum daily screen time for Tarbiyah learning</p>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="flex items-center gap-2 px-8 py-3 bg-[#052e16] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all"
                >
                  {savingSettings ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ParentDashboard;
