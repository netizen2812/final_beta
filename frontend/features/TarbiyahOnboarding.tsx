
import React, { useState } from 'react';
import { 
  Play, Lock, Star, ShieldCheck, Crown, 
  ArrowRight, Users, Check, Sparkles, 
  MessageCircle, Video, TrendingUp,
  Clock, BookOpen, AlertCircle, Loader2
} from 'lucide-react';
import axios from 'axios';
import { loadRazorpayScript } from '../utils/razorpay';
import { MovingBackground } from './TarbiyahLobby';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TarbiyahOnboarding = ({ getToken }: { getToken: any }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinBatch = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await loadRazorpayScript();
      if (!res) { alert("Razorpay SDK failed to load."); setIsLoading(false); return; }

      const { data: order } = await axios.post(`${API_BASE}/api/payment/create-order`, {
        planType: 'TARBIYAH_LIFETIME'
      }, { headers: { Authorization: `Bearer ${token}` } });

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Imam",
        description: "Lifetime Tarbiyah Access",
        order_id: order.id,
        handler: async function (response: any) {
             await axios.post(`${API_BASE}/api/payment/verify`, {
                 ...response,
                 planType: 'TARBIYAH_LIFETIME'
             }, { headers: { Authorization: `Bearer ${token}` } });
             alert("Welcome! Payment successful. Please wait while an Admin assigns your batch!");
             window.location.reload();
        },
        theme: { color: "#052e16" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      alert("Payment initiation failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500 relative overflow-x-hidden">
      <MovingBackground />

      {/* SECTION 1 — HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 px-6">
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
             <Sparkles size={14} /> New Enrollment Open
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black leading-tight text-white drop-shadow-2xl">
            Quran Learning That <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Keeps Your Child Engaged</span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100/70 max-w-2xl mx-auto leading-relaxed">
            No waiting. No boredom. Continuous learning with live scholar guidance and interactive class journey.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#022c22] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3 mx-auto"
            >
              Start Learning Now <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — THE PROBLEM */}
      <section className="relative py-24 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <h2 className="text-3xl font-bold text-white mb-4 italic">Typical Classes Today</h2>
             <div className="w-20 h-1 bg-emerald-800 mx-auto rounded-full opacity-50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Clock className="text-orange-400" />, title: "Kids wait for their turn", desc: "Most time is spent listening to others, leading to distraction." },
              { icon: <AlertCircle className="text-rose-400" />, title: "Passive Learning", desc: "No incentive to pay attention when the scholar isn't speaking to them." },
              { icon: <TrendingUp className="text-blue-400" rotate={180}/>, title: "Low Engagement", desc: "Traditional group calls often leave children feeling disconnected." }
            ].map((card, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:bg-white/10 transition-colors group">
                <div className="bg-black/40 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  {card.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                <p className="text-emerald-100/50 leading-relaxed text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — THE IMAM WAY */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <h2 className="text-4xl font-serif font-black text-white">How IMAM Classes Work</h2>
             <p className="text-emerald-200/60 max-w-lg mx-auto">Our unique 3-step active classroom ensures every minute is valuable.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-px bg-white/10 z-0"></div>
            
            {[
              { step: "1", title: "Practice", desc: "Your child practices assigned ayah while others recite. No idle time.", icon: <BookOpen />, color: "from-blue-500 to-indigo-500" },
              { step: "2", title: "Engage", desc: "They stay involved by observing and answering prompts from the scholar.", icon: <MessageCircle />, color: "from-emerald-500 to-teal-500" },
              { step: "3", title: "Recite", desc: "They recite live with scholar and get immediate correction.", icon: <Video />, color: "from-amber-500 to-orange-500" }
            ].map((step, i) => (
              <div key={i} className="flex-1 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 h-full flex flex-col items-center text-center hover:border-emerald-500/30 transition-all group">
                   <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} p-0.5 mb-8 shadow-2xl group-hover:scale-110 transition-all`}>
                      <div className="w-full h-full bg-[#022c22] rounded-[1.4rem] flex items-center justify-center">
                         {React.cloneElement(step.icon as any, { size: 32, className: "text-white" })}
                      </div>
                   </div>
                   <div className="text-xs font-black uppercase tracking-tighter text-emerald-500 mb-2">Step {step.step}</div>
                   <h3 className="text-2xl font-black mb-4">{step.title}</h3>
                   <p className="text-emerald-100/50 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4 — WHY IT WORKS */}
      <section className="relative py-24 px-6 bg-[#033c2e]/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
           <div>
              <h2 className="text-4xl font-serif font-black mb-8 leading-tight">Why It Works</h2>
              <ul className="space-y-6">
                {[
                  "No idle time - every student is active throughout the hour.",
                  "Learn at personal pace - curriculum matches your child's speed.",
                  "Better retention through active participation.",
                  "Direct scholar guidance to fix Tajweed mistakes as they happen."
                ].map((point, i) => (
                  <li key={i} className="flex gap-4 items-start group">
                    <div className="bg-emerald-500/20 p-1.5 rounded-lg text-emerald-400 mt-1 group-hover:scale-110 transition-all">
                      <Check size={18} strokeWidth={3} />
                    </div>
                    <span className="text-lg text-emerald-100/80">{point}</span>
                  </li>
                ))}
              </ul>
           </div>
           <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <div className="relative bg-black/40 rounded-[3rem] p-4 border border-white/10 aspect-square flex items-center justify-center overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent"></div>
                 <Crown size={120} className="text-emerald-500/20 animate-pulse" />
                 <div className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                    <div className="flex gap-2 mb-2">
                       {[...Array(5)].map((_, i) => <Star key={i} size={14} className="fill-emerald-400 text-emerald-400" />)}
                    </div>
                    <p className="text-sm font-medium italic">"My daughter actually looks forward to her Quran time now. She loves seeing the map progress!"</p>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT YOU GET */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-emerald-900/40 to-black/40 backdrop-blur-xl rounded-[3rem] p-12 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={100} />
           </div>
           <h2 className="text-3xl font-black mb-10 text-center uppercase tracking-widest text-[#5deac8]">Tarbiyah Live</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
              {[
                "16 Live Sessions per month",
                "Small Group Guided Classes",
                "Personalized Progression Map",
                "Real-time Correction",
                "Interactive Learning System",
                "XP & Rewards Gamification"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Check size={14} strokeWidth={4} />
                   </div>
                   <span className="font-bold text-emerald-50/80">{item}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* SECTION 6 — TRUST / CLARITY */}
      <section className="relative py-24 px-6">
         <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 opacity-80">
            <div className="flex items-center gap-3">
               <ShieldCheck size={28} className="text-emerald-400" />
               <span className="font-medium text-emerald-100">Guided by Scholars</span>
            </div>
            <div className="flex items-center gap-3">
               <TrendingUp size={28} className="text-emerald-400" />
               <span className="font-medium text-emerald-100">Suitable for Beginners</span>
            </div>
            <div className="flex items-center gap-3">
               <Star size={28} className="text-emerald-400" />
               <span className="font-medium text-emerald-100">No Fixed Start Point</span>
            </div>
         </div>
      </section>

      {/* SECTION 7 — PRICING */}
      <section id="pricing" className="relative py-32 px-6">
         <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="inline-block bg-black/40 border border-white/10 px-6 py-3 rounded-full text-emerald-300 font-bold uppercase tracking-widest text-sm">
               Simple Transparent Pricing
            </div>
            <div className="space-y-4">
               <div className="text-7xl font-black text-white">₹399<span className="text-2xl text-emerald-100/50">/month</span></div>
               <p className="text-emerald-200/40">Includes all 16 sessions + Unlimited access to Tarbiyah World</p>
            </div>
            
            <div className="max-w-md mx-auto bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm py-2 border-b border-white/5">
                     <span className="text-emerald-200/60">Live Classes</span>
                     <span className="font-bold uppercase tracking-widest">Included</span>
                  </div>
                  <div className="flex justify-between text-sm py-2 border-b border-white/5">
                     <span className="text-emerald-200/60">Curriculum Tracking</span>
                     <span className="font-bold uppercase tracking-widest">Included</span>
                  </div>
                  <div className="flex justify-between text-sm py-2">
                     <span className="text-emerald-200/60">Rewards & Rewards</span>
                     <span className="font-bold uppercase tracking-widest">Included</span>
                  </div>
               </div>
               
               <button 
                onClick={handleJoinBatch}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-[0_15px_40px_rgba(16,185,129,0.4)] flex items-center justify-center gap-3"
               >
                 {isLoading ? <Loader2 className="animate-spin" /> : <><Crown size={20} /> Join First Batch</>}
               </button>
            </div>
         </div>
      </section>

      {/* SECTION 8 — FINAL PUSH */}
      <section className="relative py-40 px-6 bg-gradient-to-t from-black/80 to-transparent">
         <div className="max-w-3xl mx-auto text-center space-y-12">
            <h2 className="text-4xl md:text-5xl font-serif font-black">Give your child a better way to learn Quran</h2>
            <button 
               onClick={handleJoinBatch}
               disabled={isLoading}
               className="bg-white text-[#022c22] px-12 py-6 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(255,255,255,0.1)] flex items-center gap-3 mx-auto text-lg"
            >
               {isLoading ? <Loader2 className="animate-spin" /> : "Start Their Journey Now"}
            </button>
         </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20"></div>
    </div>
  );
};
