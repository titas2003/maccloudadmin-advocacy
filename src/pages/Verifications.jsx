import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  ShieldCheck, ShieldX, Clock, ChevronLeft, ChevronRight, Eye, X, CheckCircle, XCircle, Search, RefreshCw, Scale
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const IMG = (p) => p ? `http://localhost:5006/${p.replace(/\\/g, '/')}` : null;

export default function Verifications() {
  const [advocates, setAdvocates] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/advocates', { params: { page, limit: 10, status: 'Pending' } });
      if (data.success) {
        setAdvocates(data.data);
        setPagination(data.pagination);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  return (
    <Layout>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pending Verifications</h1>
          <p className="text-slate-500 text-sm mt-1">Review advocates waiting for KYC approval.</p>
        </div>
        <button onClick={fetchPending} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading pending verifications...</div>
        ) : advocates.length === 0 ? (
          <div className="py-16 text-center">
            <ShieldCheck size={36} className="text-green-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm font-bold">All caught up!</p>
            <p className="text-slate-400 text-xs mt-1">No pending verifications at the moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Advocate</th>
                  <th className="px-5 py-3">ADV ID</th>
                  <th className="px-5 py-3">State</th>
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
                    <td className="px-5 py-3.5 text-xs text-slate-500">{adv.state}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => navigate('/advocates')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
                        Review in Advocates Page
                      </button>
                    </td>
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
