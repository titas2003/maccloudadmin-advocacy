import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Search, Shield, ShieldCheck, ShieldX, Clock,
  ChevronLeft, ChevronRight, Eye, X, CheckCircle,
  XCircle, AlertCircle, Phone, Mail, MapPin, Star,
  Scale, RefreshCw, Filter
} from 'lucide-react';

const STATUSES = ['All', 'Pending', 'Verified', 'Rejected'];
const IMG = (p) => p ? `http://localhost:5006/${p.replace(/\\/g, '/')}` : null;

const STATUS_CFG = {
  Verified: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: <ShieldCheck size={11} /> },
  Pending:  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={11} /> },
  Rejected: { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200',   icon: <ShieldX size={11} /> },
};

export default function Advocates() {
  const [advocates, setAdvocates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);   // for detail drawer
  const [detailLoading, setDetailLoading] = useState(false);
  const [verifyModal, setVerifyModal] = useState(null); // { advocate, action: 'Verified'|'Rejected' }
  const [reason, setReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAdvocates = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await api.get('/admin/advocates', { params });
      if (data.success) {
        setAdvocates(data.data);
        setPagination(data.pagination);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchAdvocates(); }, [fetchAdvocates]);

  // Reset page on filter/search change
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openDetail = async (adv) => {
    setSelected(adv);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/advocates/${adv.advId}`);
      if (data.success) setSelected(data.data);
    } catch { /* use list data */ }
    finally { setDetailLoading(false); }
  };

  const handleVerify = async () => {
    if (!verifyModal) return;
    if (verifyModal.action === 'Rejected' && !reason.trim()) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/admin/advocates/${verifyModal.advocate.advId}/verify`, {
        vStatus: verifyModal.action,
        reason: reason.trim() || undefined,
      });
      if (data.success) {
        showToast(`${verifyModal.advocate.name} has been ${verifyModal.action.toLowerCase()}.`);
        setAdvocates(prev => prev.map(a =>
          a.advId === verifyModal.advocate.advId ? { ...a, vStatus: verifyModal.action } : a
        ));
        if (selected?.advId === verifyModal.advocate.advId) {
          setSelected(s => ({ ...s, vStatus: verifyModal.action }));
        }
        fetchAdvocates();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed.', 'error');
    }
    setActionLoading(false);
    setVerifyModal(null);
    setReason('');
  };

  // Stats derived from current page (real totals come from backend pagination)
  const stats = {
    total: pagination.total,
    pending:  advocates.filter(a => a.vStatus === 'Pending').length,
    verified: advocates.filter(a => a.vStatus === 'Verified').length,
    rejected: advocates.filter(a => a.vStatus === 'Rejected').length,
  };

  return (
    <Layout>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[200] flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold text-white transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
          {toast.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {toast.msg}
        </div>
      )}

      {/* Verify confirm modal */}
      {verifyModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${verifyModal.action === 'Verified' ? 'bg-green-100' : 'bg-red-100'}`}>
              {verifyModal.action === 'Verified'
                ? <ShieldCheck size={22} className="text-green-600" />
                : <ShieldX size={22} className="text-red-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {verifyModal.action === 'Verified' ? 'Verify' : 'Reject'} Advocate
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              You are about to <strong>{verifyModal.action.toLowerCase()}</strong>{' '}
              <strong>{verifyModal.advocate.name}</strong>.
              {verifyModal.action === 'Verified'
                ? ' This will notify them via email.'
                : ' A reason is required.'}
            </p>
            {verifyModal.action === 'Rejected' && (
              <textarea
                rows={3}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Enter rejection reason (required)..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-red-400/20 resize-none mb-4"
              />
            )}
            {verifyModal.action === 'Verified' && (
              <textarea
                rows={2}
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="Optional note for advocate..."
                className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-green-400/20 resize-none mb-4"
              />
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setVerifyModal(null); setReason(''); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >Cancel</button>
              <button
                onClick={handleVerify}
                disabled={actionLoading || (verifyModal.action === 'Rejected' && !reason.trim())}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 ${verifyModal.action === 'Verified' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {actionLoading ? 'Processing...' : `Confirm ${verifyModal.action}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[110] shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="bg-[#1a2b4b] px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {IMG(selected.photo)
                  ? <img src={IMG(selected.photo)} alt={selected.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/20" />
                  : <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-lg">{selected.name?.[0]}</div>
                }
                <div>
                  <p className="text-white font-bold">{selected.name}</p>
                  <p className="text-blue-300 text-xs">{selected.advId}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLoading && <p className="text-slate-400 text-sm text-center py-4">Loading details...</p>}

              {/* Status & action */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selected.vStatus} />
                <div className="flex gap-2">
                  {selected.vStatus !== 'Verified' && (
                    <button onClick={() => setVerifyModal({ advocate: selected, action: 'Verified' })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all">
                      <ShieldCheck size={13} /> Verify
                    </button>
                  )}
                  {selected.vStatus !== 'Rejected' && (
                    <button onClick={() => setVerifyModal({ advocate: selected, action: 'Rejected' })}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all">
                      <ShieldX size={13} /> Reject
                    </button>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <InfoRow icon={<Mail size={14} />} label="Email" value={selected.email} />
                <InfoRow icon={<Phone size={14} />} label="Phone" value={selected.phone} />
                <InfoRow icon={<MapPin size={14} />} label="State" value={selected.state} />
                <InfoRow icon={<Scale size={14} />} label="Court Division" value={selected.courtDivision?.name || '—'} />
                <InfoRow icon={<Scale size={14} />} label="Specialization" value={selected.specialization?.name || '—'} />
                <InfoRow icon={<Star size={14} />} label="Rating" value={selected.rating ? `${selected.rating} ★` : '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="Experience" value={selected.yearsOfExperience ? `${selected.yearsOfExperience} yrs` : '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="Fees/Sitting" value={selected.feesPerSitting ? `₹${selected.feesPerSitting}` : '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="Enroll No." value={selected.enrollmentNumber || '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="PAN" value={selected.panNumber || '—'} />
              </div>

              {/* Verification docs */}
              {selected.verificationDocs && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Verification Docs</p>
                  <div className="space-y-2">
                    {[
                      { label: 'PAN Image', key: 'panImage' },
                      { label: 'Aadhar Image', key: 'aadharImage' },
                      { label: 'Enrollment Cert.', key: 'enrollmentCertificate' },
                      { label: 'Photo', key: 'photo' },
                    ].map(({ label, key }) => {
                      const url = IMG(selected.verificationDocs?.[key] || selected[key]);
                      return (
                        <div key={key} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-xs font-semibold text-slate-600">{label}</span>
                          {url
                            ? <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">View ↗</a>
                            : <span className="text-[10px] text-slate-400 font-semibold">Not uploaded</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {selected.vReason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider mb-1">Rejection Reason</p>
                  <p className="text-sm text-red-700">{selected.vReason}</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Page header */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Advocates</h1>
          <p className="text-slate-500 text-sm mt-1">Manage, verify and monitor all registered advocates.</p>
        </div>
        <button onClick={fetchAdvocates} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Total', value: pagination.total, color: 'bg-blue-50', icon: <Scale size={18} className="text-blue-500" /> },
          { label: 'Verified', value: advocates.filter(a=>a.vStatus==='Verified').length, color: 'bg-green-50', icon: <ShieldCheck size={18} className="text-green-500" /> },
          { label: 'Pending', value: advocates.filter(a=>a.vStatus==='Pending').length, color: 'bg-amber-50', icon: <Clock size={18} className="text-amber-500" /> },
          { label: 'Rejected', value: advocates.filter(a=>a.vStatus==='Rejected').length, color: 'bg-red-50', icon: <ShieldX size={18} className="text-red-500" /> },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-black text-slate-800">{s.value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email, ADV ID..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s ? 'bg-[#1a2b4b] text-white border-[#1a2b4b]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading advocates...</div>
        ) : advocates.length === 0 ? (
          <div className="py-16 text-center">
            <Scale size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No advocates found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Advocate</th>
                  <th className="px-5 py-3">ADV ID</th>
                  <th className="px-5 py-3">Specialization</th>
                  <th className="px-5 py-3">State</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {advocates.map(adv => (
                  <tr key={adv._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {IMG(adv.photo)
                          ? <img src={IMG(adv.photo)} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={adv.name} />
                          : <div className="w-8 h-8 rounded-full bg-[#1a2b4b] flex items-center justify-center text-white text-xs font-black">{adv.name?.[0]}</div>
                        }
                        <div>
                          <p className="font-bold text-slate-700 text-sm">{adv.name}</p>
                          <p className="text-[10px] text-slate-400">{adv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">{adv.advId}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{adv.specialization?.name || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{adv.state}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={adv.vStatus} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(adv)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                          <Eye size={12} /> View
                        </button>
                        {adv.vStatus !== 'Verified' && (
                          <button onClick={() => setVerifyModal({ advocate: adv, action: 'Verified' })}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all">
                            ✓ Verify
                          </button>
                        )}
                        {adv.vStatus !== 'Rejected' && (
                          <button onClick={() => setVerifyModal({ advocate: adv, action: 'Rejected' })}
                            className="px-2.5 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all">
                            ✕ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
              {' '}· {pagination.total} total
            </p>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all">
                <ChevronLeft size={13} /> Prev
              </button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-all">
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status}
    </span>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-slate-400 text-xs">{icon} {label}</div>
      <span className="text-xs font-semibold text-slate-700 text-right max-w-[200px] truncate">{value || '—'}</span>
    </div>
  );
}
