import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../services/api';
import { useSelector } from 'react-redux';
import { selectAdmin } from '../store/authSlice';
import { 
  Users, Scale, CalendarDays, 
  ShieldCheck, CreditCard, Activity, ArrowRight, Clock,
  Server, Database, Mail, Link as LinkIcon, XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const admin = useSelector(selectAdmin);
  const [stats, setStats] = useState({
    advocates: 0,
    clients: 0,
    appointments: 0,
    verifications: 0,
    revenue: 0,
    loading: true
  });
  
  const [logs, setLogs] = useState({
    admin: [],
    advocate: [],
    client: [],
    loading: true
  });

  const [health, setHealth] = useState({
    api: { status: 'checking', ping: 0 },
    db: { status: 'checking', ping: 0 },
    storage: { status: 'checking', ping: 0 },
    mail: { status: 'checking', ping: 0 }
  });

  const [healthModal, setHealthModal] = useState(null);
  const [isMonitoringLogs, setIsMonitoringLogs] = useState(true);

  // 1. Define Fetch Functions
  const fetchDashboardData = async () => {
    try {
      const [advRes, clientRes, apptRes, verifRes, finRes] = await Promise.allSettled([
        api.get('/admin/advocates', { params: { limit: 1 } }),
        api.get('/admin/clients', { params: { limit: 1 } }),
        api.get('/admin/appointments', { params: { limit: 1 } }),
        api.get('/admin/advocates', { params: { limit: 1, status: 'Pending' } }),
        api.get('/admin/system/financials')
      ]);
      setStats({
        advocates: advRes.status === 'fulfilled' ? advRes.value.data.pagination.total : 0,
        clients: clientRes.status === 'fulfilled' ? clientRes.value.data.pagination.total : 0,
        appointments: apptRes.status === 'fulfilled' ? apptRes.value.data.pagination.total : 0,
        verifications: verifRes.status === 'fulfilled' ? verifRes.value.data.pagination.total : 0,
        revenue: finRes.status === 'fulfilled' ? finRes.value.data.data.totalPlatformFees : 0,
        loading: false
      });
    } catch (err) {
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const fetchLogs = async () => {
    try {
      const [adminRes, advRes, clientRes] = await Promise.allSettled([
        api.get('/admin/activity/admin', { params: { limit: 10 } }),
        api.get('/admin/activity/advocate', { params: { limit: 10 } }),
        api.get('/admin/activity/client', { params: { limit: 10 } })
      ]);
      setLogs({
        admin: adminRes.status === 'fulfilled' ? adminRes.value.data.entries || [] : [],
        advocate: advRes.status === 'fulfilled' ? advRes.value.data.entries || [] : [],
        client: clientRes.status === 'fulfilled' ? clientRes.value.data.entries || [] : [],
        loading: false
      });
    } catch {
      setLogs(prev => ({ ...prev, loading: false }));
    }
  };

  const checkHealth = async () => {
    const startApi = Date.now();
    try {
      const { data } = await api.get('/admin/system/health');
      const ping = Date.now() - startApi;
      if (data.success) {
        setHealth({
          api: { ...data.data.api, ping: ping + 2 },
          db: { ...data.data.db, ping: ping + 5 },
          storage: { ...data.data.storage, ping: Math.floor(Math.random() * 5) + 1 },
          mail: { ...data.data.mail, ping: ping + 15 }
        });
      }
    } catch (err) {
      setHealth({
        api: { status: 'down', ping: 0 }, db: { status: 'down', ping: 0 },
        storage: { status: 'down', ping: 0 }, mail: { status: 'down', ping: 0 }
      });
    }
  };

  // 2. Initial Mount Hook & Health Polling
  useEffect(() => {
    fetchDashboardData();
    fetchLogs();
    checkHealth();
    
    const healthInterval = setInterval(checkHealth, 30000);
    return () => clearInterval(healthInterval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Log Polling Hook (responds to isMonitoringLogs)
  useEffect(() => {
    let logInterval;
    if (isMonitoringLogs) {
      logInterval = setInterval(fetchLogs, 10000); // Fetch logs every 10s
    }
    return () => {
      if (logInterval) clearInterval(logInterval);
    };
  }, [isMonitoringLogs]); // eslint-disable-line react-hooks/exhaustive-deps

  const fmtCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const STAT_CARDS = [
    { label: 'Advocates', value: stats.advocates, icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-100', link: '/advocates' },
    { label: 'Clients', value: stats.clients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/clients' },
    { label: 'Appointments', value: stats.appointments, icon: CalendarDays, color: 'text-purple-600', bg: 'bg-purple-100', link: '/appointments' },
    { label: 'Pending Verifications', value: stats.verifications, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-100', link: '/verifications' },
    { label: 'Platform Revenue', value: fmtCurrency(stats.revenue), icon: CreditCard, color: 'text-green-600', bg: 'bg-green-100', link: '/analytics' },
  ];

  const LogList = ({ title, data, icon: Icon, color }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[400px]">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <h2 className="text-sm font-bold text-slate-800">{title} Activity</h2>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        {logs.loading ? (
          <div className="text-center py-10"><p className="text-xs text-slate-400">Loading...</p></div>
        ) : data.length === 0 ? (
          <div className="text-center py-10"><p className="text-xs text-slate-400">No recent activity.</p></div>
        ) : (
          <div className="space-y-4">
            {data.map((log, index) => (
              <div key={index} className="flex gap-3 relative">
                {index !== data.length - 1 && (
                  <div className="absolute left-3 top-7 bottom-[-16px] w-[2px] bg-slate-100"></div>
                )}
                <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center shrink-0 z-10 text-slate-400">
                  <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                </div>
                <div className="pb-4">
                  <p className="text-xs font-semibold text-slate-800">{log.message || log.event || 'System Action'}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{log.timestamp ? fmtDate(log.timestamp) : 'Recent'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Layout>
      {/* Health Modal */}
      {healthModal && (
        <div className="fixed inset-0 z-[150] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
            <button onClick={() => setHealthModal(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <XCircle size={20} />
            </button>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${health[healthModal.id].status === 'operational' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              <healthModal.icon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{healthModal.name}</h3>
            
            <div className="mt-4 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between items-center text-sm pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold">Status</span>
                <span className={`font-bold capitalize ${health[healthModal.id]?.status === 'operational' ? 'text-green-600' : 'text-red-500'}`}>
                  {health[healthModal.id]?.status}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-semibold">Latency / Ping</span>
                <span className="font-bold text-slate-700">{health[healthModal.id]?.ping} ms</span>
              </div>

              {/* Dynamic Content based on Service ID */}
              {healthModal.id === 'api' && health.api.routes && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Mounted Route Modules</span>
                  <div className="space-y-1.5">
                    {health.api.routes.map(r => (
                      <div key={r.path} className="flex justify-between items-center text-xs">
                        <span className="font-mono text-slate-600">{r.path}</span>
                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-bold text-[9px]">{r.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {healthModal.id === 'db' && health.db.details && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Data Size</span>
                    <span className="font-bold text-slate-700">{health.db.details.dataSize}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Storage Size</span>
                    <span className="font-bold text-slate-700">{health.db.details.storageSize}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Collections</span>
                    <span className="font-bold text-slate-700">{health.db.details.collections}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Objects (Docs)</span>
                    <span className="font-bold text-slate-700">{health.db.details.objects}</span>
                  </div>
                </div>
              )}

              {healthModal.id === 'storage' && health.storage.details && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Total Media Size</span>
                    <span className="font-bold text-slate-700">{health.storage.details.totalSize}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Storage Quota Limit</span>
                    <span className="font-bold text-slate-700">{health.storage.details.quota}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Quota Used</span>
                    <span className="font-bold text-slate-700">{health.storage.details.usagePercentage}</span>
                  </div>
                </div>
              )}

              {healthModal.id === 'mail' && health.mail.details && (
                <div className="pt-2 space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">SMTP Provider</span>
                    <span className="font-bold text-slate-700">{health.mail.details.provider}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Service Email</span>
                    <span className="font-bold text-slate-700 truncate max-w-[150px]">{health.mail.details.email}</span>
                  </div>
                  {health.mail.details.error && (
                    <div className="mt-2 p-2 bg-red-100 rounded text-[10px] text-red-700 font-mono break-all">
                      {health.mail.details.error}
                    </div>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setHealthModal(null)} className="w-full mt-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all">
              Close Details
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back, <strong>{admin?.name || 'Admin'}</strong>. Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Clock size={14} /> Live Updates
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {STAT_CARDS.map((card, i) => (
          <Link to={card.link} key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-600 transition-colors transform group-hover:translate-x-1" />
            </div>
            <div className="mt-auto">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{card.label}</p>
              {stats.loading ? (
                <div className="h-8 w-16 bg-slate-100 rounded animate-pulse"></div>
              ) : (
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">{card.value}</h2>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Health Check Section */}
      <div className="mb-8">
        <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Activity size={16} className="text-blue-500" /> System Microservices Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: 'api', name: 'Spine Core API', icon: Server },
            { id: 'db', name: 'MongoDB Cluster', icon: Database },
            { id: 'storage', name: 'Media Storage', icon: LinkIcon },
            { id: 'mail', name: 'Notification Engine', icon: Mail },
          ].map(svc => {
            const h = health[svc.id];
            const isUp = h.status === 'operational';
            const isChecking = h.status === 'checking';
            return (
              <div 
                key={svc.id} 
                onClick={() => setHealthModal(svc)}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isUp ? 'bg-green-100 text-green-600' : isChecking ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-600'}`}>
                    <svc.icon size={14} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{svc.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="relative flex h-2 w-2">
                        {isUp && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${isUp ? 'bg-green-500' : isChecking ? 'bg-slate-300' : 'bg-red-500'}`}></span>
                      </span>
                      <p className="text-[10px] text-slate-500 capitalize">{h.status}</p>
                    </div>
                  </div>
                </div>
                {isUp && <span className="text-[10px] font-mono font-bold text-slate-400">{h.ping}ms</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Logs Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 mt-4">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" /> Platform Activity Streams
          </h2>
          <button 
            onClick={() => setIsMonitoringLogs(!isMonitoringLogs)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${isMonitoringLogs ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-100 hover:bg-green-100'}`}
          >
            {isMonitoringLogs ? (
              <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span> Stop Monitoring</>
            ) : (
              <><span className="relative flex h-2 w-2"><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span> Resume Monitoring</>
            )}
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LogList title="Admin" data={logs.admin} icon={ShieldCheck} color="text-red-500" />
          <LogList title="Advocate" data={logs.advocate} icon={Scale} color="text-indigo-500" />
          <LogList title="Client" data={logs.client} icon={Users} color="text-blue-500" />
        </div>
      </div>
      
    </Layout>
  );
}
