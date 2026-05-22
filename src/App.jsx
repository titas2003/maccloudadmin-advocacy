import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './guards/ProtectedRoute';
import GuestRoute from './guards/GuestRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

// Lazy-load all other pages for code splitting
const Advocates    = React.lazy(() => import('./pages/Advocates'));
const Clients      = React.lazy(() => import('./pages/Clients'));
const Appointments = React.lazy(() => import('./pages/Appointments'));
const Verifications= React.lazy(() => import('./pages/Verifications'));
const Financials   = React.lazy(() => import('./pages/Financials'));
const Analytics    = React.lazy(() => import('./pages/Analytics'));
const AppSettings  = React.lazy(() => import('./pages/AppSettings'));
const NotFound     = React.lazy(() => import('./pages/NotFound'));

const Loader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />

          {/* Protected */}
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/advocates"    element={<ProtectedRoute><Advocates /></ProtectedRoute>} />
          <Route path="/clients"      element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/verifications"element={<ProtectedRoute><Verifications /></ProtectedRoute>} />
          <Route path="/financials"   element={<ProtectedRoute><Financials /></ProtectedRoute>} />
          <Route path="/analytics"    element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/settings"     element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
