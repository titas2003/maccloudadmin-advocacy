import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import {
  TrendingUp, BarChart2, PieChart, Activity, RefreshCw, IndianRupee, ShieldCheck
} from 'lucide-react';

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/system/financials');
      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const fmtCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

  return (
    <Layout>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Platform Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">High-level financial and system overview.</p>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all bg-white shadow-sm">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">Gathering insights...</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500 text-sm bg-red-50 rounded-xl border border-red-100">{error}</div>
      ) : (
        <div className="space-y-6">
          {/* Top Line Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 rounded-2xl p-6 shadow-lg shadow-blue-500/20 text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                <BarChart2 size={100} />
              </div>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-2">Total Processed Volume</p>
              <h2 className="text-3xl font-black">{fmtCurrency(stats?.totalVolume)}</h2>
              <p className="text-blue-200 text-xs mt-3 flex items-center gap-1"><TrendingUp size={12} /> All-time Gross Volume</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-6 shadow-lg shadow-green-500/20 text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                <IndianRupee size={100} />
              </div>
              <p className="text-green-100 text-xs font-bold uppercase tracking-wider mb-2">Platform Revenue</p>
              <h2 className="text-3xl font-black">{fmtCurrency(stats?.totalPlatformFees)}</h2>
              <p className="text-green-200 text-xs mt-3 flex items-center gap-1"><ShieldCheck size={12} /> Earned from Fees & Surcharges</p>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl p-6 shadow-lg shadow-purple-500/20 text-white relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                <PieChart size={100} />
              </div>
              <p className="text-purple-100 text-xs font-bold uppercase tracking-wider mb-2">Advocate Earnings</p>
              <h2 className="text-3xl font-black">{fmtCurrency(stats?.totalAdvocateEarnings)}</h2>
              <p className="text-purple-200 text-xs mt-3 flex items-center gap-1"><Activity size={12} /> Disbursed to Advocates</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
               <div className="text-center">
                 <PieChart size={48} className="text-slate-200 mx-auto mb-3" />
                 <p className="text-slate-400 font-semibold text-sm">Revenue Distribution Chart</p>
                 <p className="text-slate-400 text-xs mt-1">More visualisations coming soon</p>
               </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[300px] flex items-center justify-center">
               <div className="text-center">
                 <Activity size={48} className="text-slate-200 mx-auto mb-3" />
                 <p className="text-slate-400 font-semibold text-sm">Activity Heatmap</p>
                 <p className="text-slate-400 text-xs mt-1">Platform usage trends coming soon</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
