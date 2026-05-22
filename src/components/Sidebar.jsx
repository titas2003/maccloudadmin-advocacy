import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutAdmin, selectAdmin } from '../store/authSlice';
import {
  LayoutDashboard, Users, Scale, CalendarDays,
  ShieldCheck, CreditCard, BarChart3, Settings, Sliders,
  ChevronLeft, ChevronRight, LogOut, Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/' },
  { label: 'Advocates',    icon: Scale,           to: '/advocates' },
  { label: 'Clients',      icon: Users,           to: '/clients' },
  { label: 'Appointments', icon: CalendarDays,    to: '/appointments' },
  { label: 'Verifications',icon: ShieldCheck,     to: '/verifications' },
  { label: 'Financials',   icon: CreditCard,      to: '/financials' },
  { label: 'Analytics',    icon: BarChart3,       to: '/analytics' },
  { label: 'Admin Controls', icon: Sliders,        to: '/settings' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const admin = useSelector(selectAdmin);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logoutAdmin());
    navigate('/login', { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
        : 'text-slate-400 hover:bg-white/10 hover:text-white'
    }`;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center justify-between px-4 py-5 border-b border-white/10 ${collapsed ? 'px-3' : ''}`}>
        {!collapsed && (
          <div>
            <h1 className="text-lg font-black text-white tracking-tight">MACCLOUD</h1>
            <p className="text-[10px] text-blue-300 font-semibold uppercase tracking-widest">Admin Console</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all ml-auto"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
        <button onClick={() => setMobileOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
          <X size={20} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass} onClick={() => setMobileOpen(false)}>
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Admin footer */}
      <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
        <div className={`flex items-center gap-2 px-3 py-2 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-black shrink-0">
            {admin?.name?.[0]?.toUpperCase() || 'A'}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{admin?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{admin?.email}</p>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#1a2b4b] text-white rounded-xl shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-[#1a2b4b] transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-[#1a2b4b] min-h-screen transition-all duration-300 ${collapsed ? 'w-16' : 'w-60'} shrink-0`}>
        <SidebarContent />
      </aside>
    </>
  );
}
