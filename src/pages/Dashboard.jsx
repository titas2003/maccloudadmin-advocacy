import React from 'react';
import Layout from '../components/Layout';
import { useSelector } from 'react-redux';
import { selectAdmin } from '../store/authSlice';
import { LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
  const admin = useSelector(selectAdmin);

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome back, <strong>{admin?.name || 'Admin'}</strong>. Here's what's happening.
        </p>
      </div>

      {/* Placeholder grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {['Advocates', 'Clients', 'Appointments', 'Verifications', 'Revenue', 'Activity'].map(label => (
          <div
            key={label}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
              <LayoutDashboard size={22} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-black text-slate-300 animate-pulse mt-1">—</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
        <LayoutDashboard size={36} className="text-slate-200 mx-auto mb-3" />
        <p className="text-slate-400 text-sm font-medium">Dashboard widgets coming soon</p>
        <p className="text-slate-300 text-xs mt-1">Use the sidebar to navigate to any section</p>
      </div>
    </Layout>
  );
}
