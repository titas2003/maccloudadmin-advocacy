import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Settings, AlertTriangle, Send, RefreshCw, CheckCircle, XCircle, Database, Users, ShieldAlert, IndianRupee, Save, Edit3
} from 'lucide-react';

export default function AppSettings() {
  const [loadingAction, setLoadingAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [notification, setNotification] = useState({ target: 'clients', subject: '', message: '' });
  
  // Fee Policy state
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [editingBracket, setEditingBracket] = useState(null); // bracketKey
  const [editForm, setEditForm] = useState({ defaultFee: '', maxFee: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const { data } = await api.get('/admin/fee-policies');
      if (data.success) {
        setPolicies(data.data);
      }
    } catch { /* silent */ }
    finally { setLoadingPolicies(false); }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleDropSessions = async () => {
    if (!window.confirm('Are you absolutely sure you want to drop ALL active sessions? This will force everyone out of the platform immediately.')) return;
    setLoadingAction('drop_sessions');
    try {
      const { data } = await api.post('/admin/system/drop-all-sessions');
      if (data.success) showToast(data.message);
      else showToast(data.message, 'error');
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to drop sessions', 'error');
    }
    setLoadingAction(null);
  };

  const handleSeedPolicies = async () => {
    if (!window.confirm('Are you sure you want to seed default fee policies? This might overwrite existing configurations.')) return;
    setLoadingAction('seed_policies');
    try {
      const { data } = await api.post('/admin/fee-policies/seed');
      if (data.success) {
        showToast('Fee policies seeded successfully');
        fetchPolicies(); // refresh list
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to seed policies', 'error');
    }
    setLoadingAction(null);
  };

  const handleRefreshFees = async () => {
    if (!window.confirm('Are you sure you want to run the fee audit? This will flag advocates and send them warning emails if they violate the active fee policies.')) return;
    setLoadingAction('refresh_fees');
    try {
      const { data } = await api.post('/admin/fee-policies/refreshFees');
      if (data.success) {
        showToast(data.message);
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to audit fees', 'error');
    }
    setLoadingAction(null);
  };

  const handleSavePolicy = async (bracketKey) => {
    setLoadingAction(`save_policy_${bracketKey}`);
    try {
      const { data } = await api.put(`/admin/fee-policies/${bracketKey}`, {
        defaultFee: Number(editForm.defaultFee),
        maxFee: Number(editForm.maxFee)
      });
      if (data.success) {
        showToast(`Policy for bracket ${bracketKey} updated`);
        setEditingBracket(null);
        fetchPolicies();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to update policy', 'error');
    }
    setLoadingAction(null);
  };

  const startEditing = (policy) => {
    setEditingBracket(policy.bracketKey);
    setEditForm({ defaultFee: policy.defaultFee, maxFee: policy.maxFee });
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notification.subject.trim() || !notification.message.trim()) return;
    if (!window.confirm(`Send bulk notification to all ${notification.target}?`)) return;
    
    setLoadingAction('notify');
    try {
      const { data } = await api.post(`/admin/notifications/${notification.target}`, {
        subject: notification.subject,
        message: notification.message
      });
      if (data.success) {
        showToast(`Notification sent to ${notification.target} successfully`);
        setNotification({ ...notification, subject: '', message: '' });
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to send notification', 'error');
    }
    setLoadingAction(null);
  };

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Admin Controls</h1>
        <p className="text-slate-500 text-sm mt-1">Configure platform rules, fees, and trigger system-wide actions.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          {/* Danger Zone */}
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-sm">
            <div className="bg-red-50/50 px-5 py-4 border-b border-red-100 flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg text-red-600"><AlertTriangle size={18} /></div>
              <div>
                <h2 className="font-bold text-red-800">Danger Zone</h2>
                <p className="text-xs text-red-600/80">Critical system actions. Use with extreme caution.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-red-100 bg-red-50/30">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Invalidate All Sessions</h3>
                  <p className="text-xs text-slate-500 mt-1">Forces all advocates and clients to log out immediately. Sends maintenance email to all users.</p>
                </div>
                <button
                  onClick={handleDropSessions}
                  disabled={loadingAction !== null}
                  className="shrink-0 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {loadingAction === 'drop_sessions' ? 'Executing...' : 'Drop Sessions'}
                </button>
              </div>
            </div>
          </div>

          {/* Setup Tools */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 bg-slate-200 rounded-lg text-slate-600"><Database size={18} /></div>
              <div>
                <h2 className="font-bold text-slate-800">Initial Setup & Data</h2>
                <p className="text-xs text-slate-500">Seed defaults and metadata.</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Seed Default Fee Policies</h3>
                  <p className="text-xs text-slate-500 mt-1">Initializes the database with standard fee brackets and platform margins.</p>
                </div>
                <button
                  onClick={handleSeedPolicies}
                  disabled={loadingAction !== null}
                  className="shrink-0 px-4 py-2 bg-[#1a2b4b] hover:bg-[#253d6a] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  {loadingAction === 'seed_policies' ? 'Seeding...' : 'Run Seed'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Notifications */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full">
          <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Send size={18} /></div>
            <div>
              <h2 className="font-bold text-slate-800">Bulk Notifications</h2>
              <p className="text-xs text-slate-500">Send platform-wide announcements via email.</p>
            </div>
          </div>
          <form onSubmit={handleSendNotification} className="p-5 space-y-5 flex-1 flex flex-col">
            
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Target Audience</label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setNotification({ ...notification, target: 'clients' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${notification.target === 'clients' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Users size={14} /> Clients
                </button>
                <button
                  type="button"
                  onClick={() => setNotification({ ...notification, target: 'advocates' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${notification.target === 'advocates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ShieldAlert size={14} /> Advocates
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Subject Line</label>
              <input
                type="text"
                value={notification.subject}
                onChange={e => setNotification({ ...notification, subject: e.target.value })}
                placeholder="e.g. Scheduled Platform Maintenance"
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">HTML Message Body</label>
              <textarea
                value={notification.message}
                onChange={e => setNotification({ ...notification, message: e.target.value })}
                placeholder="<p>Enter your HTML formatted message here...</p>"
                required
                className="w-full flex-1 min-h-[150px] p-4 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50 resize-none font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loadingAction !== null || !notification.subject.trim() || !notification.message.trim()}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              {loadingAction === 'notify' ? (
                <><RefreshCw size={16} className="animate-spin" /> Sending...</>
              ) : (
                <><Send size={16} /> Broadcast to {notification.target.charAt(0).toUpperCase() + notification.target.slice(1)}</>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Fee Policy Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><IndianRupee size={18} /></div>
             <div>
               <h2 className="font-bold text-slate-800">Fee Policies & Enforcement</h2>
               <p className="text-xs text-slate-500">Manage experience-based fee brackets and run compliance audits.</p>
             </div>
          </div>
          <button
            onClick={handleRefreshFees}
            disabled={loadingAction !== null}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
          >
            {loadingAction === 'refresh_fees' ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
            Audit Advocate Fees
          </button>
        </div>

        <div className="p-5">
          {loadingPolicies ? (
            <p className="text-slate-400 text-sm py-4">Loading fee policies...</p>
          ) : policies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-3">No fee policies found.</p>
              <button onClick={handleSeedPolicies} className="px-4 py-2 bg-[#1a2b4b] text-white text-sm font-bold rounded-xl">Seed Default Policies</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-4 py-3">Experience Bracket</th>
                    <th className="px-4 py-3">Default Fee (₹)</th>
                    <th className="px-4 py-3">Max Allowed Fee (₹)</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map(policy => {
                    const isEditing = editingBracket === policy.bracketKey;
                    return (
                      <tr key={policy._id} className={isEditing ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}>
                        <td className="px-4 py-3 font-bold text-slate-700">
                          {policy.bracketKey} years
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editForm.defaultFee} 
                              onChange={e => setEditForm({...editForm, defaultFee: e.target.value})}
                              className="w-24 px-2 py-1 border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            />
                          ) : (
                            <span className="font-semibold text-slate-600">₹{policy.defaultFee}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input 
                              type="number" 
                              value={editForm.maxFee} 
                              onChange={e => setEditForm({...editForm, maxFee: e.target.value})}
                              className="w-24 px-2 py-1 border border-blue-300 rounded outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                            />
                          ) : (
                            <span className="font-semibold text-slate-600">₹{policy.maxFee}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => setEditingBracket(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Cancel</button>
                              <button 
                                onClick={() => handleSavePolicy(policy.bracketKey)}
                                disabled={loadingAction === `save_policy_${policy.bracketKey}`}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all"
                              >
                                {loadingAction === `save_policy_${policy.bracketKey}` ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />} Save
                              </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => startEditing(policy)}
                              className="flex items-center gap-1 ml-auto px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold rounded-lg transition-all"
                            >
                              <Edit3 size={12} /> Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </Layout>
  );
}
