import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import {
  Check,
  X,
  Loader2,
  Users,
  Plus,
  Trash2,
  StopCircle,
  Search,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AdminLiveDashboard = () => {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<'batches' | 'debug'>('batches');

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-[#052e16]">Live Administration</h1>
          <p className="text-slate-500">Manage access requests and teaching batches.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
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

      {activeTab === 'batches' && <BatchManager token={getToken} />}
      {activeTab === 'debug' && <DebugPanel token={getToken} />}
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
      const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
      const list = Array.isArray(res.data) ? res.data : (res.data?.batches || []);
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
      <p className="text-xs text-amber-600 font-bold uppercase">Verification mode - remove after test</p>
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
            {batches.map((b) =>
              (participantsByBatch[b._id]?.length ? participantsByBatch[b._id] : [{ childName: '-', isActive: false }]).map((p: any, i: number) => (
                <tr key={`${b._id}-${p.childId || i}`} className="border-b border-slate-100">
                  <td className="p-3">{i === 0 ? b.name : ''}</td>
                  <td className="p-3">{p.childName || p.childId || '-'}</td>
                  <td className="p-3">{p.currentSurah != null ? `Surah ${p.currentSurah}, Ayah ${p.currentAyah}` : '-'}</td>
                  <td className="p-3">{p.lastSeen ? new Date(p.lastSeen).toLocaleString() : '-'}</td>
                </tr>
              ))
            )}
            {batches.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500">No batches</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <h3 className="font-bold text-lg text-[#052e16] mt-8">Qibla</h3>
      <p className="text-sm text-slate-500">Open Ibadah -&gt; Qibla Finder to see user coords, magnetic heading, declination, true heading, and qibla bearing in the debug block at the bottom of the page.</p>
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
    status: 'upcoming',
  });
  const [batchSearch, setBatchSearch] = useState('');
  const [scholarSearchQuery, setScholarSearchQuery] = useState('');
  const [scholars, setScholars] = useState<any[]>([]);
  const [showManageStudents, setShowManageStudents] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [paidUsers, setPaidUsers] = useState<any[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPaidUsers = async () => {
    try {
      const t = await token();
      const res = await axios.get(`${API_BASE}/api/admin/users?isPaid=true&source=razorpay&limit=20`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      // Filter out placeholder account
      setPaidUsers(data.filter((u: any) => u.email !== 'void@razorpay.com'));
    } catch {
      console.error("Failed to load paid users");
    }
  };

  useEffect(() => {
    if (showManageStudents) {
      fetchPaidUsers();
      setFoundUsers([]);
      setStudentSearch('');
    }
  }, [showManageStudents]);

  const fetchScholars = async (query = '') => {
    try {
      const t = await token();
      const res = await axios.get(`${API_BASE}/api/admin/users?role=scholar&q=${query}&limit=20`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      setScholars(data);
    } catch {
      console.error("Failed to load scholars");
    }
  };

  useEffect(() => {
    if (showCreate) fetchScholars();
  }, [showCreate]);

  // Handle scholar search in creation form
  useEffect(() => {
    if (showCreate && scholarSearchQuery.length > 1) {
      const delay = setTimeout(() => fetchScholars(scholarSearchQuery), 400);
      return () => clearTimeout(delay);
    }
  }, [scholarSearchQuery]);

  const fetchBatches = async () => {
    try {
      const t = await token();
      const res = await axios.get(`${API_BASE}/api/live/admin/batches?q=${batchSearch}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      setBatches(Array.isArray(res.data) ? res.data : (res.data?.batches || []));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchBatches, 300);
    return () => clearTimeout(delay);
  }, [batchSearch]);

  const searchParents = async () => {
    if (!studentSearch.trim()) return;
    setIsLoadingResults(true);
    try {
      const t = await token();
      // Switch to backend search for better regex/case-insensitive matching
      const res = await axios.get(`${API_BASE}/api/admin/users/search?q=${studentSearch}`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      // Filter out placeholder account
      setFoundUsers(data.filter((u: any) => u.email !== 'void@razorpay.com'));
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  const addStudent = async (childId: string) => {
    if (!selectedBatch) return;
    setProcessingId(childId);
    try {
      const t = await token();
      await axios.post(`${API_BASE}/api/live/admin/batch/${selectedBatch._id}/add-student`, { childId }, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
      const rawData = Array.isArray(res.data) ? res.data : (res.data?.batches || []);
      
      // Sanitize data: filter out null students from batches
      const batchesData = rawData.map((b: any) => ({
        ...b,
        students: (b.students || []).filter((s: any) => s != null)
      }));

      const updated = batchesData.find((b: any) => b._id === selectedBatch._id);
      setBatches(batchesData);
      setSelectedBatch(updated);

      // Refresh search results to show new user states
      await searchParents();
      await fetchPaidUsers();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.details || err.message || "Failed to add student";
      alert(msg);
    } finally {
      setProcessingId(null);
    }
  };

  const removeStudent = async (childId: string) => {
    if (!confirm("Remove student?")) return;
    try {
      const t = await token();
      await axios.post(`${API_BASE}/api/live/admin/batch/${selectedBatch._id}/remove-student`, { childId }, {
        headers: { Authorization: `Bearer ${t}` },
      });
      const res = await axios.get(`${API_BASE}/api/live/admin/batches`, { headers: { Authorization: `Bearer ${t}` } });
      const rawData = Array.isArray(res.data) ? res.data : (res.data?.batches || []);
      
      const batchesData = rawData.map((b: any) => ({
        ...b,
        students: (b.students || []).filter((s: any) => s != null)
      }));

      const updated = batchesData.find((b: any) => b._id === selectedBatch._id);
      setBatches(batchesData);
      setSelectedBatch(updated);
      
      // Refresh search results so IDs can be re-added
      searchParents();
      fetchPaidUsers();
    } catch {
      alert("Failed to remove student");
    }
  };

  const openManage = (batch: any) => {
    setSelectedBatch(batch);
    setShowManageStudents(batch._id);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const createBatch = async () => {
    try {
      const t = await token();
      await axios.post(`${API_BASE}/api/live/admin/batch`, newItem, {
        headers: { Authorization: `Bearer ${t}` },
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
        headers: { Authorization: `Bearer ${t}` },
      });
      fetchBatches();
    } catch {
      alert("Delete failed");
    }
  };

  const handleForceEnd = async (batchId: string) => {
    if (!confirm("EMERGENCY: Force reset this batch session? This clears active participants and resets status to upcoming.")) return;
    try {
      const t = await token();
      await axios.post(`${API_BASE}/api/live/admin/batch/${batchId}/force-end`, {}, {
        headers: { Authorization: `Bearer ${t}` },
      });
      fetchBatches();
    } catch {
      alert("Force end failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            className="w-full bg-slate-50 border-none ring-1 ring-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-emerald-500 transition-all font-medium"
            placeholder="Search batches or scholars..." 
            value={batchSearch} 
            onChange={(e) => setBatchSearch(e.target.value)} 
          />
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="bg-[#052e16] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/10 hover:bg-emerald-900 transition-all active:scale-95">
          <Plus size={18} /> Create New Batch
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
          <h3 className="font-bold">New Batch Details</h3>
          <input className="w-full border p-2 rounded" placeholder="Batch Name (e.g. Quran Beginners A)" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />

          <div className="grid grid-cols-2 gap-4">
            <select className="w-full border p-2 rounded" value={newItem.level} onChange={(e) => setNewItem({ ...newItem, level: e.target.value })}>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assign Scholar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                className="w-full border-none ring-1 ring-slate-200 p-2 rounded-xl pl-9 text-sm focus:ring-emerald-500 mb-2" 
                placeholder="Type to search scholars..." 
                value={scholarSearchQuery} 
                onChange={(e) => setScholarSearchQuery(e.target.value)} 
              />
              <select 
                className="w-full border-none ring-1 ring-slate-200 p-2 rounded-xl text-sm focus:ring-emerald-500 bg-white" 
                value={newItem.scholar} 
                onChange={(e) => setNewItem({ ...newItem, scholar: e.target.value })}
              >
                <option value="">{scholars.length === 0 ? 'No scholars found' : 'Select Scholar'}</option>
                {scholars.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={createBatch} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold">Save Batch</button>
        </div>
      )}

      <div className="grid gap-4">
        {batches.map((b) => (
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
              {b.status === 'active' && (
                <button
                  onClick={() => handleForceEnd(b._id)}
                  title="Emergency Stop"
                  className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-lg transition-colors"
                >
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
                  <input 
                    className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    placeholder="Search Parent Email/Name..." 
                    value={studentSearch} 
                    onChange={(e) => setStudentSearch(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && searchParents()}
                  />
                  <button 
                    onClick={searchParents} 
                    disabled={isLoadingResults}
                    className="bg-blue-600 text-white px-3 rounded text-sm font-bold hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                  >
                    {isLoadingResults ? '...' : 'Search'}
                  </button>
                </div>

                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Search Results */}
                  {foundUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest pl-1">Search Results</p>
                      {foundUsers.map((u) => (
                        <UserRow key={u._id} user={u} selectedBatch={selectedBatch} addStudent={addStudent} processingId={processingId} />
                      ))}
                    </div>
                  )}

                  {/* Paid Users Quick select */}
                  {paidUsers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1">Recent Razorpay Users</p>
                      {paidUsers.filter(u => !foundUsers.some(fu => fu._id === u._id)).map((u) => (
                        <UserRow key={u._id} user={u} selectedBatch={selectedBatch} addStudent={addStudent} processingId={processingId} />
                      ))}
                    </div>
                  )}

                  {!isLoadingResults && studentSearch && foundUsers.length === 0 && (
                     <div className="text-center py-8 text-slate-400 text-sm">No matches found for "{studentSearch}"</div>
                  )}

                  {!isLoadingResults && !studentSearch && paidUsers.length === 0 && (
                     <div className="text-center py-8 text-slate-400 text-sm">Search for a parent or wait for paid users...</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-l pl-6">
                <h4 className="font-bold text-sm text-slate-500 uppercase">Enrolled Students ({selectedBatch.students?.length || 0})</h4>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedBatch.students?.filter((s: any) => s != null).map((s: any) => (
                    <div key={s._id || s} className="flex flex-col bg-slate-50 p-3 rounded-lg border border-slate-100 group">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-800">{s.name || 'Unknown Student'}</span>
                        <button onClick={() => removeStudent(s._id || s)} className="text-red-300 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      {s.email && <div className="text-[10px] text-slate-400 font-medium">{s.email}</div>}
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

const UserRow = ({ user, selectedBatch, addStudent, processingId }: { user: any, selectedBatch: any, addStudent: any, processingId: string | null }) => {
  const isEnrolled = (childId: string) => selectedBatch.students?.some((s: any) => s && (s._id || s) === childId);
  const isProvisioned = user.pendingBatchId && String(user.pendingBatchId) === String(selectedBatch._id);
  const isCurrentlyProcessing = processingId === user._id;

  return (
    <div className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50/80 transition-all bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-bold text-xs text-[#052e16]">{user.name}</div>
          <div className="text-[10px] text-slate-400">{user.email}</div>
        </div>
        {user.processedPayments?.length > 0 && (
          <span className="text-[8px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Paid</span>
        )}
      </div>
      <div className="space-y-1">
        {user.children?.map((c: any) => (
          <button
            key={c._id}
            onClick={() => addStudent(c._id)}
            disabled={isEnrolled(c._id) || processingId === c._id}
            className={`w-full text-left text-[11px] p-2 rounded-lg flex justify-between items-center transition-all ${isEnrolled(c._id) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-transparent active:scale-[0.98]'}`}
          >
            <span className="font-medium">
              {processingId === c._id ? 'Enrolling...' : c.name}
            </span>
            {isEnrolled(c._id) ? (
              <Check size={10} className="text-emerald-500" />
            ) : (
              <Plus size={10} className="text-slate-400" />
            )}
          </button>
        ))}
        {(!user.children || user.children.length === 0) && (
          <button
            onClick={() => addStudent(user._id)}
            disabled={isProvisioned || isCurrentlyProcessing}
            className={`w-full text-center text-[10px] p-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1 ${isProvisioned ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default' : isCurrentlyProcessing ? 'bg-blue-50 text-blue-400 border border-blue-100 cursor-not-allowed' : 'bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 active:scale-95'}`}
          >
            {isCurrentlyProcessing ? (
              <>
                <Loader2 size={10} className="animate-spin" />
                Preparing...
              </>
            ) : isProvisioned ? (
              <>
                <Check size={10} />
                Provisioned
              </>
            ) : (
              <>
                <Plus size={10} />
                Initialize & Enroll
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminLiveDashboard;
