import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  loginAdmin, requestOtp, loginWithOtp,
  clearError, resetOtpState,
  selectAuthLoading, selectAuthError, selectOtpSent
} from '../store/authSlice';
import { ShieldCheck, Eye, EyeOff, Lock, Hash, KeyRound, ArrowLeft, Mail } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [admId, setAdmId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const otpSent = useSelector(selectOtpSent);

  const from = location.state?.from?.pathname || '/';

  // Clean up on unmount
  useEffect(() => () => { dispatch(clearError()); dispatch(resetOtpState()); }, [dispatch]);

  // Switch mode resets form state
  const switchMode = (m) => {
    setMode(m);
    setPassword(''); setOtp('');
    dispatch(clearError());
    dispatch(resetOtpState());
  };

  // ---- Password Login ----
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!admId.trim() || !password) return;
    const result = await dispatch(loginAdmin({ admId: admId.trim(), password }));
    if (loginAdmin.fulfilled.match(result)) navigate(from, { replace: true });
  };

  // ---- OTP Step 1: Send OTP ----
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!admId.trim()) return;
    dispatch(requestOtp({ admId: admId.trim() }));
  };

  // ---- OTP Step 2: Verify OTP ----
  const handleOtpLogin = async (e) => {
    e.preventDefault();
    if (!otp.trim()) return;
    const result = await dispatch(loginWithOtp({ admId: admId.trim(), otp: otp.trim() }));
    if (loginWithOtp.fulfilled.match(result)) navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f1b35] via-[#1a2b4b] to-[#0a1628] flex items-center justify-center p-4">
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl shadow-lg shadow-blue-600/40 mb-4">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">MACCLOUDSPIN<span className="text-blue-400">E</span></h1>
            <p className="text-blue-300/80 text-xs font-semibold uppercase tracking-[3px] mt-1">Admin Console</p>
          </div>

          {/* Mode tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
            <button
              onClick={() => switchMode('password')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'password' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Lock size={12} /> Password
            </button>
            <button
              onClick={() => switchMode('otp')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'otp' ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail size={12} /> Email OTP
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-500/15 border border-red-500/25 rounded-xl text-red-300 text-sm font-medium">
              {error}
            </div>
          )}

          {/* OTP success hint */}
          {mode === 'otp' && otpSent && !error && (
            <div className="mb-5 px-4 py-3 bg-green-500/15 border border-green-500/25 rounded-xl text-green-300 text-sm font-medium">
              ✉️ If this ADM ID is registered, an OTP has been sent to the associated email. Enter it below.
            </div>
          )}

          {/* ===== PASSWORD FORM ===== */}
          {mode === 'password' && (
            <form onSubmit={handlePasswordLogin} className="space-y-5" autoComplete="off">
              <AdmIdField value={admId} onChange={setAdmId} />
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    required
                    autoComplete="current-password"
                    className="input-field pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <SubmitButton loading={isLoading} disabled={!admId.trim() || !password} label="Sign In to Console" />
            </form>
          )}

          {/* ===== OTP FORM ===== */}
          {mode === 'otp' && !otpSent && (
            <form onSubmit={handleRequestOtp} className="space-y-5" autoComplete="off">
              <AdmIdField value={admId} onChange={setAdmId} />
              <SubmitButton loading={isLoading} disabled={!admId.trim()} label="Send OTP to Email" />
            </form>
          )}

          {mode === 'otp' && otpSent && (
            <form onSubmit={handleOtpLogin} className="space-y-5" autoComplete="off">
              {/* ADM ID read-only */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">ADM ID</label>
                <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl">
                  <Hash size={15} className="text-slate-500 shrink-0" />
                  <span className="text-white font-bold text-sm tracking-widest">{admId.toUpperCase()}</span>
                  <button
                    type="button"
                    onClick={() => { dispatch(resetOtpState()); dispatch(clearError()); }}
                    className="ml-auto text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ArrowLeft size={14} />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">
                  6-Digit OTP
                </label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    required
                    className="input-field tracking-[0.4em] text-center font-bold"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1.5 text-right">
                  Didn't receive it?{' '}
                  <button
                    type="button"
                    onClick={() => dispatch(requestOtp({ admId: admId.trim() }))}
                    className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                  >
                    Resend OTP
                  </button>
                </p>
              </div>
              <SubmitButton loading={isLoading} disabled={otp.length < 6} label="Verify & Sign In" />
            </form>
          )}

          <p className="text-center text-slate-600 text-xs mt-6">
            Restricted access · Authorised personnel only
          </p>
        </div>
      </div>

      {/* Inline styles for reuse */}
      <style>{`
        .input-field {
          width: 100%;
          padding: 12px 14px 12px 38px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: white;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-field::placeholder { color: #475569; }
        .input-field:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.15);
        }
      `}</style>
    </div>
  );
}

// ---- Shared sub-components ----

function AdmIdField({ value, onChange }) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mb-2">
        ADM ID
      </label>
      <div className="relative">
        <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value.toUpperCase())}
          placeholder="ADM000001"
          required
          autoComplete="off"
          spellCheck={false}
          className="input-field font-mono tracking-widest"
        />
      </div>
    </div>
  );
}

function SubmitButton({ loading, disabled, label }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Processing...
        </>
      ) : label}
    </button>
  );
}
