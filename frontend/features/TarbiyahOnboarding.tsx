
import React, { useState } from 'react';
import { 
  Play, Lock, Star, ShieldCheck, Crown, 
  ArrowRight, Users, Check, Sparkles, 
  MessageCircle, Video, TrendingUp,
  Clock, BookOpen, AlertCircle, Loader2,
  Trophy, Flame, Target, Zap, Eye, Mic,
  Award, Map, BarChart2, Heart
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
             alert("Welcome! Payment successful. Your batch will be assigned shortly!");
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

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 1 — HERO                        */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-24 px-6">
        <div className="max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
             <Sparkles size={14} /> New Enrollment Open
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-black leading-tight text-white drop-shadow-2xl">
            Quran Learning That <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Keeps Your Child Engaged</span>
          </h1>
          <p className="text-xl md:text-2xl text-emerald-100/70 max-w-2xl mx-auto leading-relaxed">
            Live scholar-led classes. Interactive journey map. XP rewards. A system built so your child never sits idle.
          </p>
          <div className="pt-8">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#022c22] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3 mx-auto"
            >
              Start Learning Now <ArrowRight size={20} />
            </button>
          </div>
          
          {/* Floating Stats */}
          <div className="flex flex-wrap justify-center gap-6 pt-6 opacity-60">
             <div className="flex items-center gap-2 text-sm"><Users size={16} className="text-emerald-400" /> Small Group Classes</div>
             <div className="flex items-center gap-2 text-sm"><Trophy size={16} className="text-amber-400" /> XP & Leaderboards</div>
             <div className="flex items-center gap-2 text-sm"><ShieldCheck size={16} className="text-blue-400" /> Scholar Guided</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 2 — THE PROBLEM                  */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-black/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
             <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">The Problem</p>
             <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">Typical Quran Classes Today</h2>
             <div className="w-20 h-1 bg-emerald-800 mx-auto rounded-full opacity-50"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Clock className="text-orange-400" size={28}/>, title: "Kids Wait for Their Turn", desc: "In a typical group class, your child spends over 70% of the time just waiting. That's most of the session wasted." },
              { icon: <AlertCircle className="text-rose-400" size={28}/>, title: "Zero Engagement While Observing", desc: "When it's not their turn, children zone out. There's no incentive to listen to classmates recite." },
              { icon: <TrendingUp className="text-blue-400" size={28}/>, title: "No Tracking or Feedback", desc: "Parents have zero visibility. No reports, no progress tracking, no idea how their child is actually doing." }
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

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 3 — THE IMAM WAY                 */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20 space-y-4">
             <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] mb-3">The IMAM Difference</p>
             <h2 className="text-4xl font-serif font-black text-white">Every Minute Counts in Our Classroom</h2>
             <p className="text-emerald-200/60 max-w-lg mx-auto">While one student recites, every other child stays active through our unique 3-step system.</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch gap-4 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[3rem] left-[16%] right-[16%] h-px z-0">
               <div className="w-full h-full bg-gradient-to-r from-blue-500/30 via-emerald-500/30 to-amber-500/30"></div>
            </div>
            
            {[
              { step: "1", title: "Practice", desc: "Your child practices their assigned ayah independently while a classmate recites. Built-in Quran reader tracks their position.", icon: <BookOpen />, color: "from-blue-500 to-indigo-500", accent: "text-blue-400" },
              { step: "2", title: "Observe & Engage", desc: "While a classmate recites, the scholar asks everyone: 'Did they read it correctly?' Your child taps Yes or No. The scholar then reveals the answer — kids who got it right earn XP. This keeps every child actively listening and judging Tajweed, even when it's not their turn.", icon: <Eye />, color: "from-emerald-500 to-teal-500", accent: "text-emerald-400" },
              { step: "3", title: "Recite Live", desc: "When it's their turn, they recite directly with the scholar who scores their Tajweed in real-time. Scores feed into the class leaderboard.", icon: <Mic />, color: "from-amber-500 to-orange-500", accent: "text-amber-400" }
            ].map((step, i) => (
              <div key={i} className="flex-1 relative z-10">
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-10 h-full flex flex-col items-center text-center hover:border-emerald-500/30 transition-all group">
                   <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} p-0.5 mb-8 shadow-2xl group-hover:scale-110 transition-all`}>
                      <div className="w-full h-full bg-[#022c22] rounded-[1.4rem] flex items-center justify-center">
                         {React.cloneElement(step.icon as any, { size: 32, className: "text-white" })}
                      </div>
                   </div>
                   <div className={`text-xs font-black uppercase tracking-tighter ${step.accent} mb-2`}>Step {step.step}</div>
                   <h3 className="text-2xl font-black mb-4">{step.title}</h3>
                   <p className="text-emerald-100/50 leading-relaxed text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 4 — THE ECOSYSTEM (XP / MAP)     */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-[#033c2e]/40 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
             <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em]">Beyond Just Classes</p>
             <h2 className="text-4xl font-serif font-black text-white">A Complete Learning Ecosystem</h2>
             <p className="text-emerald-200/50 max-w-xl mx-auto">Every action earns XP. Every session unlocks progress on a beautiful interactive map.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: <Map className="text-emerald-400" size={24}/>, title: "Journey of Light Map", desc: "A beautiful 16-node interactive map that tracks live session progress. Each class unlocks the next stage." },
              { icon: <Trophy className="text-amber-400" size={24}/>, title: "Live Leaderboard", desc: "Students compete in real-time. Recitation scores + engagement answers = class ranking after every session." },
              { icon: <Flame className="text-orange-400" size={24}/>, title: "Streaks & XP System", desc: "Daily streaks, XP for every action. Consistent practice builds momentum and keeps kids coming back." },
            ].map((card, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all group">
                <div className="bg-black/30 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform border border-white/5">
                  {card.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                <p className="text-emerald-100/40 leading-relaxed text-sm">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ═══════════════════════════════════════ */}
      {/* SECTION 6 — WHAT'S INCLUDED              */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-32 px-6">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-emerald-900/40 to-black/40 backdrop-blur-xl rounded-[3rem] p-12 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sparkles size={100} />
           </div>
           <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em] text-center mb-2">Everything You Get</p>
           <h2 className="text-3xl font-black mb-10 text-center uppercase tracking-widest text-[#5deac8]">Tarbiyah Live</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-12">
              {[
                { text: "16 Live Scholar Sessions / month", highlight: true },
                { text: "Small Group Classes (5-8 kids)", highlight: false },
                { text: "Interactive Journey of Light Map", highlight: false },
                { text: "Real-time Tajweed Correction", highlight: true },
                { text: "XP, Levels & Leaderboards", highlight: false },

                { text: "Observer Engagement System", highlight: true },

                { text: "Streak Tracking & Rewards", highlight: false },
                { text: "Parent Progress Dashboard", highlight: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                   <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${item.highlight ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-500/15 text-emerald-400/60'}`}>
                      <Check size={14} strokeWidth={4} />
                   </div>
                   <span className={`font-bold ${item.highlight ? 'text-white' : 'text-emerald-50/70'}`}>{item.text}</span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 7 — TRUST / CLARITY              */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-20 px-6">
         <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { icon: <ShieldCheck className="text-emerald-400" size={28}/>, title: "Scholar-Led", desc: "Every session is guided by certified Quran scholars who score recitation live." },
                 { icon: <Heart className="text-rose-400" size={28}/>, title: "Every Child, Their Own Pace", desc: "One child could be on Surah Al-Baqarah while another is on Para 15. Each child reads their own assigned ayah independently — no waiting for others to catch up." },
                 { icon: <BarChart2 className="text-blue-400" size={28}/>, title: "Full Parent Visibility", desc: "Track XP, attendance, streaks, weekly activity, and detailed progress reports." },
               ].map((card, i) => (
                 <div key={i} className="bg-white/5 border border-white/5 rounded-[2rem] p-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-black/30 flex items-center justify-center mx-auto mb-5 border border-white/5">
                       {card.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                    <p className="text-emerald-100/40 text-sm leading-relaxed">{card.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 8 — PRICING                      */}
      {/* ═══════════════════════════════════════ */}
      <section id="pricing" className="relative py-32 px-6">
         <div className="max-w-4xl mx-auto text-center space-y-12">
            <div className="inline-block bg-black/40 border border-white/10 px-6 py-3 rounded-full text-emerald-300 font-bold uppercase tracking-widest text-sm">
               Simple Pricing, Full Access
            </div>
            <div className="space-y-4">
               <div className="text-7xl font-black text-white">₹399<span className="text-2xl text-emerald-100/50">/month</span></div>
               <p className="text-emerald-200/40">Full access to live classes, journey map, and the entire gamification system.</p>
            </div>
            
            <div className="max-w-md mx-auto bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
               <div className="space-y-4 mb-8">
                  {[
                    { label: "16 Live Scholar Sessions", value: "✓" },
                    { label: "Interactive Journey Map", value: "✓" },
                    { label: "XP, Levels & Leaderboards", value: "✓" },
                    { label: "Parent Dashboard & Reports", value: "✓" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between text-sm py-2 border-b border-white/5 last:border-b-0">
                       <span className="text-emerald-200/60">{row.label}</span>
                       <span className="font-bold text-emerald-400">{row.value}</span>
                    </div>
                  ))}
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

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 9 — FINAL PUSH                   */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-40 px-6 bg-gradient-to-t from-black/80 to-transparent">
         <div className="max-w-3xl mx-auto text-center space-y-12">
            <h2 className="text-4xl md:text-5xl font-serif font-black leading-tight">Give your child a Quran learning experience they'll actually look forward to</h2>
            <p className="text-emerald-200/50 max-w-lg mx-auto">Join the growing community of parents who chose engaged, interactive Quran education over passive waiting.</p>
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
