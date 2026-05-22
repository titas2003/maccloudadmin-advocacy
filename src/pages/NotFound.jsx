import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-center p-6">
      <p className="text-8xl font-black text-slate-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-slate-700 mb-2">Page not found</h1>
      <p className="text-slate-400 text-sm mb-6">The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-5 py-2.5 bg-[#1a2b4b] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity">
        Back to Dashboard
      </Link>
    </div>
  );
}
