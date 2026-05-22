import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  Search, Users, ShieldCheck, ShieldX, Clock,
  ChevronLeft, ChevronRight, Eye, X, CheckCircle,
  XCircle, Phone, Mail, Calendar, FileText,
  RefreshCw, Filter, User, AlertCircle
} from 'lucide-react';

const STATUSES = ['All', 'Pending', 'Verified', 'Rejected'];
const IMG = (p) => p ? `http://localhost:5006/${p.replace(/\\/g, '/')}` : null;

const STATUS_CFG = {
  Verified: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: <ShieldCheck size={11} /> },
  Pending:  { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={11} /> },
  Rejected: { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200',   icon: <ShieldX size={11} /> },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [toast, setToast] = useState(null);
  const [blockModal, setBlockModal] = useState(null); // { client }
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await api.get('/admin/clients', { params });
      if (data.success) {
        setClients(data.data);
        setPagination(data.pagination);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchClients(); }, [fetchClients]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const openDetail = async (client) => {
    setSelected(client);
    setAppointments([]);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/clients/${client._id}`);
      if (data.success) {
        setSelected(data.data.client);
        setAppointments(data.data.appointments || []);
      }
    } catch { /* use list data */ }
    finally { setDetailLoading(false); }
  };

  const handleToggleBlock = async () => {
    if (!blockModal) return;
    setActionLoading(true);
    const newBlocked = !blockModal.client.isBlocked;
    try {
      const { data } = await api.patch(`/admin/clients/${blockModal.client._id}`, {
        isBlocked: newBlocked
      });
      if (data.success) {
        showToast(`Client ${newBlocked ? 'blocked' : 'unblocked'} successfully.`);
        setClients(prev => prev.map(c =>
          c._id === blockModal.client._id ? { ...c, isBlocked: newBlocked } : c
        ));
        if (selected?._id === blockModal.client._id) {
          setSelected(s => ({ ...s, isBlocked: newBlocked }));
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed.', 'error');
    }
    setActionLoading(false);
    setBlockModal(null);
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

      {/* Block confirm modal */}
      {blockModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${blockModal.client.isBlocked ? 'bg-green-100' : 'bg-red-100'}`}>
              {blockModal.client.isBlocked
                ? <CheckCircle size={22} className="text-green-600" />
                : <AlertCircle size={22} className="text-red-600" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              {blockModal.client.isBlocked ? 'Unblock' : 'Block'} Client
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Are you sure you want to{' '}
              <strong>{blockModal.client.isBlocked ? 'unblock' : 'block'}</strong>{' '}
              <strong>{blockModal.client.name}</strong>?
              {!blockModal.client.isBlocked && ' They will lose access to the platform.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setBlockModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >Cancel</button>
              <button
                onClick={handleToggleBlock}
                disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40 ${blockModal.client.isBlocked ? 'bg-green-600 hover:bg-green-700' : 'bg-red-500 hover:bg-red-600'}`}
              >
                {actionLoading ? 'Processing...' : blockModal.client.isBlocked ? 'Unblock' : 'Block'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[100]" onClick={() => setSelected(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-[110] shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className={`px-6 py-5 flex items-center justify-between ${selected.isBlocked ? 'bg-red-700' : 'bg-[#1a2b4b]'}`}>
              <div className="flex items-center gap-3">
                {IMG(selected.photo)
                  ? <img src={IMG(selected.photo)} alt={selected.name} className="w-11 h-11 rounded-full object-cover border-2 border-white/20" />
                  : <div className="w-11 h-11 rounded-full bg-blue-500 flex items-center justify-center text-white font-black text-lg">{selected.name?.[0]}</div>
                }
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{selected.name}</p>
                    {selected.isBlocked && (
                      <span className="text-[9px] font-black bg-red-400 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Blocked</span>
                    )}
                  </div>
                  <p className="text-blue-300 text-xs">{selected.clientId || selected._id}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailLoading && <p className="text-slate-400 text-sm text-center py-4">Loading details...</p>}

              {/* Status & block action */}
              <div className="flex items-center justify-between">
                <StatusBadge status={selected.vStatus} />
                <button
                  onClick={() => setBlockModal({ client: selected })}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    selected.isBlocked
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {selected.isBlocked ? <><CheckCircle size={13} /> Unblock</> : <><XCircle size={13} /> Block Client</>}
                </button>
              </div>

              {/* Info */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
                <InfoRow icon={<Mail size={14} />} label="Email" value={selected.email} />
                <InfoRow icon={<Phone size={14} />} label="Phone" value={selected.phone} />
                <InfoRow icon={<User size={14} />} label="Client ID" value={selected.clientId || '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="PAN Number" value={selected.panNumber || '—'} />
                <InfoRow icon={<AlertCircle size={14} />} label="Aadhar" value={selected.aadharNumber ? `••••••••${selected.aadharNumber.slice(-4)}` : '—'} />
                <InfoRow icon={<Calendar size={14} />} label="Joined" value={fmtDate(selected.createdAt)} />
              </div>

              {/* KYC Documents */}
              {selected.verificationDocs && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">KYC Documents</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Aadhar Image', path: selected.verificationDocs?.aadharImage },
                      { label: 'PAN Image', path: selected.verificationDocs?.panImage },
                      { label: 'Video KYC', path: selected.verificationDocs?.videoUrl },
                      { label: 'Photo', path: selected.photo },
                    ].map(({ label, path }) => {
                      const url = IMG(path);
                      return (
                        <div key={label} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <FileText size={13} className="text-slate-400" />
                            <span className="text-xs font-semibold text-slate-600">{label}</span>
                          </div>
                          {url
                            ? <a href={url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-bold hover:underline">View ↗</a>
                            : <span className="text-[10px] text-slate-400 font-semibold">Not uploaded</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Appointment history */}
              {!detailLoading && (
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">
                    Appointment History ({appointments.length})
                  </p>
                  {appointments.length === 0 ? (
                    <p className="text-slate-400 text-xs text-center py-4">No appointments yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {appointments.map(appt => (
                        <div key={appt._id} className="flex items-center justify-between px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{appt.advId?.name || 'Unknown Advocate'}</p>
                            <p className="text-[10px] text-slate-400">{fmtDate(appt.scheduledAt || appt.createdAt)}</p>
                          </div>
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                            appt.status === 'Completed' ? 'bg-green-100 text-green-700'
                            : appt.status === 'Cancelled' ? 'bg-red-100 text-red-600'
                            : 'bg-amber-100 text-amber-700'
                          }`}>{appt.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Page header */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">View, manage and monitor all registered clients.</p>
        </div>
        <button onClick={fetchClients} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Total', value: pagination.total, color: 'bg-blue-50',  icon: <Users size={18} className="text-blue-500" /> },
          { label: 'Verified', value: clients.filter(c => c.vStatus === 'Verified').length, color: 'bg-green-50', icon: <ShieldCheck size={18} className="text-green-500" /> },
          { label: 'Pending',  value: clients.filter(c => c.vStatus === 'Pending').length,  color: 'bg-amber-50', icon: <Clock size={18} className="text-amber-500" /> },
          { label: 'Blocked',  value: clients.filter(c => c.isBlocked).length,              color: 'bg-red-50',   icon: <XCircle size={18} className="text-red-500" /> },
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
              placeholder="Search name, email, phone, client ID..."
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
          <div className="py-16 text-center text-slate-400 text-sm">Loading clients...</div>
        ) : clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No clients found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Client ID</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">KYC Docs</th>
                  <th className="px-5 py-3">vStatus</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clients.map(client => (
                  <tr key={client._id} className={`transition-colors ${client.isBlocked ? 'bg-red-50/40' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {IMG(client.photo)
                          ? <img src={IMG(client.photo)} className="w-8 h-8 rounded-full object-cover border border-slate-200" alt={client.name} />
                          : <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-xs font-black">{client.name?.[0]}</div>
                        }
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-700 text-sm">{client.name}</p>
                            {client.isBlocked && <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">BLOCKED</span>}
                          </div>
                          <p className="text-[10px] text-slate-400">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">{client.clientId || '—'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{client.phone}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1">
                        <DocDot label="Aadhar" present={!!client.verificationDocs?.aadharImage} />
                        <DocDot label="PAN" present={!!client.verificationDocs?.panImage} />
                        <DocDot label="Video" present={!!client.verificationDocs?.videoUrl} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><StatusBadge status={client.vStatus} /></td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{fmtDate(client.createdAt)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(client)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => setBlockModal({ client })}
                          className={`px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                            client.isBlocked
                              ? 'text-green-700 bg-green-100 hover:bg-green-200'
                              : 'text-red-600 bg-red-100 hover:bg-red-200'
                          }`}>
                          {client.isBlocked ? 'Unblock' : 'Block'}
                        </button>
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

// ---- Sub-components ----
function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status}
    </span>
  );
}

function DocDot({ label, present }) {
  return (
    <span title={label} className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${present ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
      {label}
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
