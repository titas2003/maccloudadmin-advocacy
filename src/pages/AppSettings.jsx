import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Settings, AlertTriangle, Send, RefreshCw, CheckCircle, XCircle, Database, Users, ShieldAlert, IndianRupee, Save, Edit3, FolderTree, Plus, Trash2, Power
} from 'lucide-react';
import ExportButtons from '../components/ExportButtons';

export default function AppSettings() {
  const [loadingAction, setLoadingAction] = useState(null);
  const [toast, setToast] = useState(null);
  const [notification, setNotification] = useState({ target: 'clients', subject: '', message: '' });
  
  // Fee Policy state
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(true);
  const [editingBracket, setEditingBracket] = useState(null); // bracketKey
  const [editForm, setEditForm] = useState({ defaultFee: '', maxFee: '' });

  // Notification Modal State
  const [notifyModal, setNotifyModal] = useState({ show: false, status: 'confirm' }); // confirm | sending | done
  const [progress, setProgress] = useState(0);

  // Category Management State
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', parent: '', isActive: true, slug: '' });
  const [editingCategoryId, setEditingCategoryId] = useState(null);

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

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const { data } = await api.get('/admin/categories?flat=true');
      if (data.success) {
        setCategories(data.data);
      }
    } catch { /* silent */ }
    finally { setLoadingCategories(false); }
  };

  useEffect(() => {
    fetchPolicies();
    fetchCategories();
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

  const initiateNotification = (e) => {
    e.preventDefault();
    if (!notification.subject.trim() || !notification.message.trim()) return;
    setNotifyModal({ show: true, status: 'confirm' });
  };

  const executeSendNotification = async () => {
    setNotifyModal({ show: true, status: 'sending' });
    setProgress(0);
    
    const progressInterval = setInterval(() => {
      setProgress(p => (p < 90 ? p + 15 : p));
    }, 200);

    setLoadingAction('notify');
    try {
      const { data } = await api.post(`/admin/notifications/${notification.target}`, {
        subject: notification.subject,
        bodyHtml: notification.message
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (data.success) {
        setTimeout(() => setNotifyModal({ show: true, status: 'done' }), 400);
        setNotification({ ...notification, subject: '', message: '' });
      } else {
        setNotifyModal({ show: false, status: 'confirm' });
        showToast(data.message, 'error');
      }
    } catch (e) {
      clearInterval(progressInterval);
      setNotifyModal({ show: false, status: 'confirm' });
      showToast(e.response?.data?.message || 'Failed to send notification', 'error');
    }
    setLoadingAction(null);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name.trim()) return;
    
    setLoadingAction('save_category');
    try {
      const payload = {
        name: categoryForm.name,
        description: categoryForm.description,
        parent: categoryForm.parent || null,
        isActive: categoryForm.isActive,
        slug: categoryForm.slug || undefined
      };

      let res;
      if (editingCategoryId) {
        res = await api.patch(`/admin/categories/${editingCategoryId}`, payload);
      } else {
        res = await api.post('/admin/categories', payload);
      }

      if (res.data.success) {
        showToast(editingCategoryId ? 'Category updated' : 'Category created');
        setCategoryForm({ name: '', description: '', parent: '', isActive: true, slug: '' });
        setEditingCategoryId(null);
        fetchCategories();
      } else {
        showToast(res.data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to save category', 'error');
    }
    setLoadingAction(null);
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this category? Subcategories will also be deactivated.')) return;
    setLoadingAction(`delete_category_${id}`);
    try {
      const { data } = await api.delete(`/admin/categories/${id}`);
      if (data.success) {
        showToast('Category deactivated');
        fetchCategories();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Failed to deactivate category', 'error');
    }
    setLoadingAction(null);
  };

  const startEditingCategory = (cat) => {
    setEditingCategoryId(cat._id);
    setCategoryForm({
      name: cat.name,
      description: cat.description || '',
      parent: cat.parent || '',
      isActive: cat.isActive,
      slug: cat.slug || ''
    });
    // Scroll to form or just let user scroll
  };

  const cancelEditingCategory = () => {
    setEditingCategoryId(null);
    setCategoryForm({ name: '', description: '', parent: '', isActive: true, slug: '' });
  };

  const exportColumns = ['Name', 'Slug', 'Parent', 'Status'];
  const exportData = categories.map(cat => {
    const parentCat = categories.find(c => c._id === cat.parent);
    return {
      'Name': cat.name,
      'Slug': cat.slug,
      'Parent': parentCat ? parentCat.name : 'None',
      'Status': cat.isActive ? 'Active' : 'Inactive'
    };
  });

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
          <form onSubmit={initiateNotification} className="p-5 space-y-5 flex-1 flex flex-col">
            
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

      {/* Category Management Section */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm mt-6">
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><FolderTree size={18} /></div>
            <div>
              <h2 className="font-bold text-slate-800">Category Management</h2>
              <p className="text-xs text-slate-500">Manage court categories and specializations for advocates.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportButtons data={exportData} columns={exportColumns} filename="categories_export" title="Categories Report" />
          </div>
        </div>
        
        <div className="p-5 grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Category Form */}
          <div className="xl:col-span-1 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
            <h3 className="font-bold text-slate-700 mb-4">{editingCategoryId ? 'Edit Category' : 'Create New Category'}</h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Category Name *</label>
                <input 
                  type="text" 
                  required
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({...categoryForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. High Court"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Slug (Optional)</label>
                <input 
                  type="text" 
                  value={categoryForm.slug}
                  onChange={e => setCategoryForm({...categoryForm, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. high-court"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Parent Category</label>
                <select 
                  value={categoryForm.parent}
                  onChange={e => setCategoryForm({...categoryForm, parent: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 bg-white"
                >
                  <option value="">-- None (Top Level) --</option>
                  {categories.map(cat => (
                    // Prevent setting itself as parent
                    cat._id !== editingCategoryId && (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    )
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                <textarea 
                  value={categoryForm.description}
                  onChange={e => setCategoryForm({...categoryForm, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none h-20"
                  placeholder="Brief description..."
                />
              </div>
              
              {editingCategoryId && (
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="checkbox" 
                    id="isActive"
                    checked={categoryForm.isActive}
                    onChange={e => setCategoryForm({...categoryForm, isActive: e.target.checked})}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-semibold text-slate-600">Active</label>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button 
                  type="submit"
                  disabled={loadingAction === 'save_category'}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
                >
                  {loadingAction === 'save_category' ? <RefreshCw size={16} className="animate-spin" /> : (editingCategoryId ? <Save size={16} /> : <Plus size={16} />)}
                  {editingCategoryId ? 'Update' : 'Create'}
                </button>
                {editingCategoryId && (
                  <button 
                    type="button"
                    onClick={cancelEditingCategory}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-bold rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Category List */}
          <div className="xl:col-span-2">
            {loadingCategories ? (
              <p className="text-slate-400 text-sm py-4">Loading categories...</p>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 border border-slate-100 rounded-xl bg-slate-50/50">
                <p className="text-slate-500 mb-3">No categories found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Slug</th>
                      <th className="px-4 py-3">Parent</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map(cat => {
                      const parentCat = categories.find(c => c._id === cat.parent);
                      return (
                        <tr key={cat._id} className={editingCategoryId === cat._id ? 'bg-emerald-50/50' : 'hover:bg-slate-50/50'}>
                          <td className="px-4 py-3 font-bold text-slate-700">
                            {cat.name}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                            {cat.slug}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {parentCat ? <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{parentCat.name}</span> : <span className="text-xs text-slate-400 italic">None</span>}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {cat.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => startEditingCategory(cat)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit3 size={14} />
                              </button>
                              {cat.isActive && (
                                <button 
                                  onClick={() => handleDeleteCategory(cat._id)}
                                  disabled={loadingAction === `delete_category_${cat._id}`}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                  title="Deactivate"
                                >
                                  {loadingAction === `delete_category_${cat._id}` ? <RefreshCw size={14} className="animate-spin" /> : <Power size={14} />}
                                </button>
                              )}
                            </div>
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
      </div>

      {/* Custom Notification Modal */}
      {notifyModal.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {notifyModal.status === 'confirm' && (
              <div className="p-6">
                <div className="mx-auto w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Send size={24} />
                </div>
                <h3 className="text-center text-lg font-bold text-slate-800 mb-2">Send Notification?</h3>
                <p className="text-center text-sm text-slate-500 mb-6">
                  Are you sure you want to broadcast this message to all <strong>{notification.target}</strong>? This action cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setNotifyModal({ show: false, status: 'confirm' })}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeSendNotification}
                    className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30"
                  >
                    Yes, Send It
                  </button>
                </div>
              </div>
            )}

            {notifyModal.status === 'sending' && (
              <div className="p-8 text-center">
                <div className="mb-4">
                  <RefreshCw size={32} className="mx-auto text-blue-500 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Sending Notifications</h3>
                <p className="text-sm text-slate-500 mb-6">Please do not close this window...</p>
                
                <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-blue-600">{progress}%</span>
              </div>
            )}

            {notifyModal.status === 'done' && (
              <div className="p-8 text-center animate-in zoom-in slide-in-from-bottom-2">
                <div className="mx-auto w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4 ring-8 ring-green-50">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Successfully Sent!</h3>
                <p className="text-sm text-slate-500 mb-6">Your message has been broadcasted to all {notification.target}.</p>
                <button 
                  onClick={() => setNotifyModal({ show: false, status: 'confirm' })}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-900 transition-colors"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </Layout>
  );
}
