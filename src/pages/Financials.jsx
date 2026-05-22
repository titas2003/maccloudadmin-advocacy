import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  DollarSign, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, Clock, XCircle, Search, Filter
} from 'lucide-react';

const STATUSES = ['All', 'pending', 'completed', 'failed', 'refunded'];

const STATUS_CFG = {
  completed: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  pending:   { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  failed:    { bg: 'bg-red-100',   text: 'text-red-700',   border: 'border-red-200' },
  refunded:  { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Financials() {
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      // Note: The backend currently doesn't filter by status in the query, but we pass it anyway
      // For a real app, we'd add the status filter to the backend controller.
      if (statusFilter !== 'All') params.status = statusFilter;
      const { data } = await api.get('/admin/financials/transactions', { params });
      if (data.success) {
        let txns = data.data;
        if (statusFilter !== 'All') {
          // Client-side fallback filter
          txns = txns.filter(t => t.status === statusFilter);
        }
        setTransactions(txns);
        setPagination(data.pagination);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const filteredTxns = transactions.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return t.clientId?.name?.toLowerCase().includes(q) || 
           t.advocateId?.name?.toLowerCase().includes(q) ||
           (t.stripeSessionId && t.stripeSessionId.toLowerCase().includes(q));
  });

  return (
    <Layout>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Financials</h1>
          <p className="text-slate-500 text-sm mt-1">Review all platform transactions and payouts.</p>
        </div>
        <button onClick={fetchTransactions} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search user or Txn ID..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-thin">
            <Filter size={14} className="text-slate-400 shrink-0" />
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${statusFilter === s ? 'bg-[#1a2b4b] text-white border-[#1a2b4b]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                {s === 'All' ? s : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <DollarSign size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Txn ID</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Client / Advocate</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTxns.map(txn => (
                  <tr key={txn._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-500">{txn.stripeSessionId?.slice(-8) || txn._id.slice(-8)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-semibold">{txn.type === 'deposit' ? 'Client Payment' : 'Advocate Payout'}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-700 text-sm">{txn.clientId?.name || 'Unknown Client'}</p>
                      <p className="text-[10px] text-slate-400">to {txn.advocateId?.name || 'Unknown Advocate'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">₹{txn.amountPaidByClient}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={txn.status} /></td>
                    <td className="px-5 py-3.5 text-right text-xs text-slate-500">{fmtDate(txn.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong>
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
  const s = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${s.bg} ${s.text} ${s.border}`}>
      {status}
    </span>
  );
}
