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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Revenue Trends */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col col-span-1 lg:col-span-2">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BarChart2 size={16} className="text-blue-500" /> Revenue Timeline (Last 6 Months)</h3>
               {stats?.revenueTrends && stats.revenueTrends.length > 0 ? (
                 <div className="flex-1 flex items-end justify-between gap-2 mt-4 pt-4 border-t border-slate-100">
                   {stats.revenueTrends.map((t, i) => {
                     // Normalize height relative to max revenue
                     const maxRev = Math.max(...stats.revenueTrends.map(x => x.revenue));
                     const hPct = maxRev > 0 ? (t.revenue / maxRev) * 100 : 0;
                     return (
                       <div key={i} className="flex flex-col items-center flex-1 group">
                         <div className="text-[10px] font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           {fmtCurrency(t.revenue)}
                         </div>
                         <div className="w-full max-w-[40px] bg-blue-100 rounded-t-md relative h-32 flex items-end overflow-hidden">
                            <div className="w-full bg-blue-500 rounded-t-md transition-all duration-500" style={{ height: `${hPct}%` }}></div>
                         </div>
                         <div className="text-xs font-semibold text-slate-500 mt-2">{t.label.split(' ')[0]}</div>
                       </div>
                     );
                   })}
                 </div>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-400 text-xs italic">No revenue data available</div>
               )}
            </div>

            {/* Location Trends */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-green-500" /> Client Locations</h3>
               <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                 {stats?.locationTrends && stats.locationTrends.length > 0 ? (
                   stats.locationTrends.map((loc, i) => (
                     <div key={i} className="flex items-center justify-between">
                       <span className="text-sm font-semibold text-slate-600 truncate max-w-[150px]">{loc.location}</span>
                       <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{loc.count} Users</span>
                     </div>
                   ))
                 ) : (
                   <p className="text-slate-400 text-xs italic text-center py-4">No location data found</p>
                 )}
               </div>
            </div>

            {/* Appointment Status Trends */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col col-span-1 lg:col-span-3">
               <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><PieChart size={16} className="text-purple-500" /> Appointment Funnel</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {stats?.appointmentTrends && stats.appointmentTrends.length > 0 ? (
                   stats.appointmentTrends.map((appt, i) => (
                     <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                       <p className="text-2xl font-black text-slate-700">{appt.count}</p>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">{appt.status}</p>
                     </div>
                   ))
                 ) : (
                   <p className="text-slate-400 text-xs italic col-span-full text-center">No appointments tracked</p>
                 )}
               </div>
            </div>

          </div>
        </div>
      )}
    </Layout>
  );
}
