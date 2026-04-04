import React, { useState } from 'react';
import { Mail, Phone, ChevronRight, X, ShieldCheck } from 'lucide-react';

interface GuestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (email: string, phone?: string) => void;
}

export const GuestEmailModal: React.FC<GuestEmailModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    onConfirm(email, undefined);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#052e16] border border-emerald-500/30 rounded-[3rem] p-10 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        
        <button 
           onClick={onClose}
           className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
        >
           <X size={24} />
        </button>

        <div className="text-center mb-10">
           <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-inner">
              <Mail size={32} />
           </div>
           <h3 className="text-3xl font-serif font-bold text-white mb-2 italic">Join the Caravan</h3>
           <p className="text-emerald-200/60 text-sm">Provide your email to secure your spot in the first batch.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-emerald-500/50 ml-2">Email Address</label>
              <div className="relative group">
                 <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/40 group-focus-within:text-emerald-400 transition-colors" size={18} />
                 <input 
                   type="email" 
                   value={email}
                   onChange={e => { setEmail(e.target.value); setError(''); }}
                   placeholder="your@email.com"
                   className="w-full bg-[#031d0e] border border-emerald-900/50 focus:border-emerald-500/50 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-white/10 outline-none transition-all shadow-inner"
                   required
                 />
              </div>
              {error && <p className="text-red-400 text-[10px] font-bold uppercase tracking-tight mt-1 ml-2">{error}</p>}
           </div>

           <div className="pt-4">
              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_50px_-10px_rgba(16,185,129,0.4)] group"
              >
                 <span>PROCEED TO PAYMENT</span>
                 <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>
        </form>

        <div className="mt-8 flex items-center justify-center gap-2 text-[#4ade80]/40">
           <ShieldCheck size={14} />
           <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Secure Zero-Knowledge Payment</span>
        </div>
      </div>
    </div>
  );
};
