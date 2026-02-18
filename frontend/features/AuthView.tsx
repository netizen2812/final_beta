
import React, { useState } from 'react';
import { Mail, Lock, User, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const AuthView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate local login/registration
    setTimeout(() => {
      login(isLogin ? (email.split('@')[0] || 'User') : name, email);
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl border border-emerald-50 p-8 md:p-12 space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/10">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-serif font-bold text-[#052e16]">Imam</h1>
            <p className="text-sm text-slate-400 font-medium">
              {isLogin ? "Welcome back, Parent" : "Start your family's journey"}
            </p>
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="text"
                placeholder="Full Name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-medium"
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="email"
              placeholder="Email Address"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-medium"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              type="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/20 transition-all font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#052e16] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>
      </div>
    </div>
  );
};
