import React, { useState } from 'react';
import {
  ChefHat,
  X,
  Mail,
  Lock,
  User,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setAuthModalOpen,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signInAsGuest,
    currentUser,
    userProfile,
  } = useAppStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await signInWithGoogle();
      if (res.error) {
        setErrorMsg(res.error);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'signin') {
        const res = await signInWithEmail(email, password);
        if (res.error) setErrorMsg(res.error);
      } else {
        const res = await signUpWithEmail(email, password, fullName);
        if (res.error) setErrorMsg(res.error);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = async () => {
    await signInAsGuest();
  };

  return (
    <div
      id="auth-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-[32px] border border-[#EBE6DC] shadow-2xl overflow-hidden flex flex-col relative text-left">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-[#737373] hover:text-[#171717] flex items-center justify-center transition-colors cursor-pointer z-10 border border-[#EBE6DC]"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-[#F0ECE4] text-center">
          <div className="w-12 h-12 bg-[#FF5A3C]/10 text-[#FF5A3C] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <ChefHat size={24} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#FF5A3C] block mb-1">
            Supabase Security & RLS
          </span>
          <h2 className="text-2xl font-serif italic text-[#171717]">
            {mode === 'signin' ? 'Welcome Back' : 'Create Atelier Account'}
          </h2>
          <p className="text-xs text-[#737373] mt-1 max-w-xs mx-auto">
            Sync your pantry staples, saved culinary masterpieces, custom preferences, and cooking history across all devices.
          </p>

          {/* Mode Switch Tabs */}
          <div className="flex bg-[#F5F1E8] p-1 rounded-xl mt-4 border border-[#EAE5DC]">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white text-[#171717] shadow-2xs'
                  : 'text-[#737373] hover:text-[#171717]'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Form */}
        <div className="p-6 space-y-4">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={loading}
            onClick={handleGoogleSignIn}
            className="w-full py-3 px-4 bg-white hover:bg-stone-50 active:scale-[0.99] text-[#171717] text-xs font-bold rounded-2xl border border-[#D9D3C7] shadow-2xs transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.43 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.98 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.57 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-[#E5DFD5] flex-1" />
            <span className="text-[10px] uppercase font-bold text-[#A3A3A3] tracking-widest">or with email</span>
            <div className="h-px bg-[#E5DFD5] flex-1" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div>
                <label className="block text-[11px] font-bold text-[#171717] mb-1">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Master Chef"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E0DBD0] text-xs text-[#171717] focus:outline-none focus:border-[#FF5A3C]"
                  />
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-[#171717] mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="chef@kitchen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E0DBD0] text-xs text-[#171717] focus:outline-none focus:border-[#FF5A3C]"
                />
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#171717] mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white rounded-xl border border-[#E0DBD0] text-xs text-[#171717] focus:outline-none focus:border-[#FF5A3C]"
                />
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3A3A3]" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-[#171717] hover:bg-black active:scale-[0.99] text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Kitchen' : 'Create Account'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Guest Browsing Option */}
          <div className="pt-2 border-t border-[#EAE5DC] text-center">
            <button
              type="button"
              onClick={handleGuest}
              className="text-xs font-bold text-[#737373] hover:text-[#171717] transition-colors cursor-pointer py-1"
            >
              Continue as Guest Chef (Local Storage Mode)
            </button>
          </div>
        </div>

        {/* Security / RLS Guarantee Footer */}
        <div className="px-6 py-3 bg-[#F5F2EC] border-t border-[#EAE5DC] flex items-center justify-center gap-2 text-[10px] text-[#737373] font-medium">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Secured with Supabase Row Level Security (RLS)</span>
        </div>
      </div>
    </div>
  );
};
