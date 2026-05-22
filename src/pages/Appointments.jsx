import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  CalendarDays, CheckCircle, Clock, XCircle, Search, Filter,
  ChevronLeft, ChevronRight, Eye, RefreshCw, X, AlertCircle
} from 'lucide-react';

const STATUSES = ['All', 'Pending', 'Scheduled', 'Completed', 'Cancelled', 'Rejected'];

const STATUS_CFG = {
  Completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: <CheckCircle size={11} /> },
  Scheduled: { bg: 'bg-blue-100',  text: 'text-blue-700',  border: 'border-blue-200',  icon: <CalendarDays size={11} /> },
  Pending:   { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: <Clock size={11} /> },
  Cancelled: { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200',   icon: <XCircle size={11} /> },
  Rejected:  { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: <XCircle size={11} /> },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusModal, setStatusModal] = useState(null); // { appointment, newStatus }
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await api.get('/admin/appointments', { params });
      if (data.success) {
        setAppointments(data.data);
        setPagination(data.pagination);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const openDetail = async (appt) => {
    setSelected(appt);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/appointments/${appt._id}`);
      if (data.success) {
        setSelected(data.data);
      }
    } catch { /* use list data */ }
    finally { setDetailLoading(false); }
  };

  const handleUpdateStatus = async () => {
    if (!statusModal) return;
    setActionLoading(true);
    try {
      const { data } = await api.patch(`/admin/appointments/${statusModal.appointment._id}/status`, {
        status: statusModal.newStatus
      });
      if (data.success) {
        showToast(`Appointment marked as ${statusModal.newStatus}.`);
        setAppointments(prev => prev.map(a =>
          a._id === statusModal.appointment._id ? { ...a, status: statusModal.newStatus } : a
        ));
        if (selected?._id === statusModal.appointment._id) {
          setSelected(s => ({ ...s, status: statusModal.newStatus }));
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast(e.response?.data?.message || 'Action failed.', 'error');
    }
    setActionLoading(false);
    setStatusModal(null);
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

      {/* Status override modal */}
      {statusModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-amber-100`}>
              <AlertCircle size={22} className="text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              Override Status
            </h3>
            <p className="text-slate-500 text-sm mb-5">
              Change appointment status to <strong>{statusModal.newStatus}</strong>? This is an admin override and should be used carefully.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >Cancel</button>
              <button
                onClick={handleUpdateStatus}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-40"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
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
            <div className="bg-[#1a2b4b] px-6 py-5 flex items-center justify-between">
              <div>
                <p className="text-white font-bold">Appointment Details</p>
                <p className="text-blue-300 text-xs">ID: {selected._id}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white"><X size={22} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {detailLoading && <p className="text-slate-400 text-sm text-center py-4">Loading details...</p>}

              <div className="flex items-center justify-between">
                <StatusBadge status={selected.status} />
                <div className="flex gap-2">
                  {selected.status !== 'Cancelled' && (
                    <button onClick={() => setStatusModal({ appointment: selected, newStatus: 'Cancelled' })}
                      className="px-3 py-1.5 text-xs font-bold bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-all">
                      Cancel Appt
                    </button>
                  )}
                  {selected.status !== 'Completed' && (
                    <button onClick={() => setStatusModal({ appointment: selected, newStatus: 'Completed' })}
                      className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all">
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>

              {/* Advocate Info */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Advocate</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <InfoRow label="Name" value={selected.advocateId?.name} />
                  <InfoRow label="ADV ID" value={selected.advocateId?.advId} />
                  <InfoRow label="Email" value={selected.advocateId?.email} />
                  <InfoRow label="Phone" value={selected.advocateId?.phone} />
                </div>
              </div>

              {/* Client Info */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Client</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <InfoRow label="Name" value={selected.clientId?.name} />
                  <InfoRow label="Email" value={selected.clientId?.email} />
                  <InfoRow label="Phone" value={selected.clientId?.phone} />
                  <InfoRow label="State" value={selected.clientId?.state} />
                </div>
              </div>

              {/* Scheduling Details */}
              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Scheduling</h3>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <InfoRow label="Requested At" value={fmtDate(selected.createdAt)} />
                  <InfoRow label="Scheduled For" value={fmtDate(selected.scheduledAt)} />
                  <InfoRow label="Duration" value={selected.duration ? `${selected.duration} mins` : '—'} />
                  <InfoRow label="Amount" value={selected.amount ? `₹${selected.amount}` : '—'} />
                  {selected.meetingLink && (
                    <InfoRow label="Meeting Link" value={<a href={selected.meetingLink} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">Join Meeting</a>} />
                  )}
                </div>
              </div>
              
              {/* Payment Info */}
              {selected.payment && (
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-3">Payment</h3>
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                     <InfoRow label="Status" value={selected.payment.status} />
                     <InfoRow label="Transaction ID" value={selected.payment.transactionId || '—'} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Page header */}
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Appointments</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor and manage all platform appointments.</p>
        </div>
        <button onClick={fetchAppointments} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-7">
        {[
          { label: 'Total', value: pagination.total, color: 'bg-blue-50',  icon: <CalendarDays size={18} className="text-blue-500" /> },
          { label: 'Pending', value: appointments.filter(a => a.status === 'Pending').length, color: 'bg-amber-50', icon: <Clock size={18} className="text-amber-500" /> },
          { label: 'Scheduled',  value: appointments.filter(a => a.status === 'Scheduled').length,  color: 'bg-indigo-50', icon: <CalendarDays size={18} className="text-indigo-500" /> },
          { label: 'Completed',  value: appointments.filter(a => a.status === 'Completed').length,              color: 'bg-green-50',   icon: <CheckCircle size={18} className="text-green-500" /> },
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
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
            <Filter size={14} className="text-slate-400 shrink-0" />
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s ? 'bg-[#1a2b4b] text-white border-[#1a2b4b]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <CalendarDays size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No appointments found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Advocate</th>
                  <th className="px-5 py-3">Date/Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map(appt => (
                  <tr key={appt._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-700 text-sm">{appt.clientId?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400">{appt.clientId?.email || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-700 text-sm">{appt.advocateId?.name || 'Unknown'}</p>
                      <p className="text-[10px] text-slate-400">{appt.advocateId?.advId || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">{fmtDate(appt.scheduledAt || appt.createdAt)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={appt.status} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => openDetail(appt)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                          <Eye size={12} /> View
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

function StatusBadge({ status }) {
  const s = STATUS_CFG[status] || STATUS_CFG.Pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {s.icon} {status}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0">
      <span className="text-slate-500 text-xs font-semibold">{label}</span>
      <span className="text-xs font-bold text-slate-800 text-right max-w-[200px] truncate">{value || '—'}</span>
    </div>
  );
}
