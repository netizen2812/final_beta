
import React, { useState } from 'react';
import { 
  Play, Lock, Star, ShieldCheck, Crown, 
  ArrowRight, Users, Check, Sparkles, 
  MessageCircle, Video, TrendingUp,
  Clock, BookOpen, AlertCircle, Loader2,
  Trophy, Flame, Target, Zap, Eye, Mic,
  Award, Map, BarChart2, Heart, HelpCircle, User
} from 'lucide-react';
import { useAuth, SignInButton } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { loadRazorpayScript } from '../utils/razorpay';
import { MovingBackground } from './TarbiyahLobby';

import { useChildContext } from '../contexts/ChildContext';

import { APPLICATION_API_URL } from '../lib/api';

export const TarbiyahOnboarding = ({ getToken, isPaid = false, handleGuestJoin }: { getToken: any, isPaid?: boolean, handleGuestJoin?: () => void }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { addChild } = useChildContext();
  
  // Profile Creation State
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: 'Boy',
    learning_level: 'Beginner'
  });

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name || !profile.age) return alert("Please fill in all fields");
    
    setIsLoading(true);
    try {
      await addChild({
        name: profile.name,
        age: parseInt(profile.age),
        gender: profile.gender as any,
        learning_level: profile.learning_level
      });
      // Context handles state update and navigation back to lobby via activeChild change
    } catch (err) {
      alert("Failed to create profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPaid) {
    return (
      <div className="min-h-screen text-white font-sans selection:bg-emerald-500 relative flex items-center justify-center p-6">
        <MovingBackground />
        <div className="max-w-md w-full bg-[#052e16]/80 backdrop-blur-xl border border-emerald-500/30 rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
              <User size={40} className="text-emerald-400" />
            </div>
            <h2 className="text-3xl font-serif font-black mb-2">Almost There! 🌟</h2>
            <p className="text-emerald-200/60 font-medium px-4">Let's set up your student's profile to unlock their journey map and join the live classes.</p>
          </div>

          <form onSubmit={handleCreateProfile} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 ml-2">Child's Name</label>
              <input 
                type="text" 
                value={profile.name}
                onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter name"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 ml-2">Age</label>
                <input 
                  type="number" 
                  value={profile.age}
                  onChange={(e) => setProfile(prev => ({ ...prev, age: e.target.value }))}
                  placeholder="Age"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 ml-2">Gender</label>
                <select 
                  value={profile.gender}
                  onChange={(e) => setProfile(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none"
                >
                  <option value="Boy">Boy</option>
                  <option value="Girl">Girl</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-emerald-400 ml-2">Learning Level</label>
              <select 
                value={profile.learning_level}
                onChange={(e) => setProfile(prev => ({ ...prev, learning_level: e.target.value }))}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 focus:outline-none focus:border-emerald-500/50 transition-all font-bold appearance-none"
              >
                <option value="Beginner">Beginner (Qaida)</option>
                <option value="Intermediate">Intermediate (Para 1-15)</option>
                <option value="Advanced">Advanced (Hifdh)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-[1.02] shadow-[0_15px_40px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 mt-8"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>Start Journey <ArrowRight size={20} /></>}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleJoinBatch = async () => {
    if (handleGuestJoin) {
      handleGuestJoin();
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await loadRazorpayScript();
      if (!res) { alert("Razorpay SDK failed to load."); setIsLoading(false); return; }

      const { data: order } = await axios.post(`${APPLICATION_API_URL}/api/payment/create-order`, {
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
          try {
            // Get a fresh token before verify call
            const freshToken = await getToken();
            await axios.post(`${APPLICATION_API_URL}/api/payment/verify`, {
                ...response,
                planType: 'TARBIYAH_LIFETIME'
            }, { headers: { Authorization: `Bearer ${freshToken}` } });
            
            alert("Payment successful! Access granted. Please refresh the page if you don't see your dashboard.");
            window.location.reload();
          } catch (err: any) {
            console.error("Verification failed", err);
            alert(`Payment was successful (ID: ${response.razorpay_payment_id}), but access couldn't be granted automatically. Please contact support with your Payment ID.`);
          }
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
          <div className="pt-8 flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#022c22] px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(16,185,129,0.3)] flex items-center gap-3"
            >
              Start Learning Now <ArrowRight size={20} />
            </button>
            <button 
              onClick={() => document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-10 py-5 rounded-2xl font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-3 backdrop-blur-md"
            >
              Learn More / FAQs <MessageCircle size={20} />
            </button>
          </div>

          <div className="pt-4 animate-in fade-in duration-1000 delay-500">
             <p className="text-emerald-100/40 text-sm font-medium">
                Already a member? 
                <SignInButton mode="modal">
                  <button className="ml-2 text-emerald-400 font-bold hover:text-emerald-300 underline underline-offset-4 decoration-emerald-500/30">Sign In to Continue</button>
                </SignInButton>
             </p>
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
               <div className="w-full h-full bg-gradient-to-r from-emerald-500/20 via-emerald-500/40 to-amber-500/20"></div>
            </div>
            
            {[
              { step: "1", title: "Practice", desc: "Your child practices their assigned ayah independently while a classmate recites. Built-in Quran reader tracks their position.", icon: <BookOpen />, color: "from-emerald-600 to-teal-500", accent: "text-emerald-400" },
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
      {/* SECTION 3.5 — MEET THE SCHOLAR           */}
      {/* ═══════════════════════════════════════ */}
      <section className="relative py-24 px-6 bg-emerald-950/20">
         <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-xl transition-all hover:border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
            <div className="flex flex-col md:flex-row items-center gap-12 p-8 md:p-16">
               <div className="w-full md:w-1/3 shrink-0">
                  <div className="relative group">
                     {/* Decorative ring */}
                     <div className="absolute -inset-4 bg-emerald-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                     <div className="absolute inset-0 bg-emerald-500 rounded-[2.5rem] rotate-6 group-hover:rotate-3 transition-transform duration-500 opacity-20"></div>
                     <img 
                        src="/images/maulana_masood.jpeg" 
                        alt="Maulana Masood Raza Misbahi Farig"
                        className="relative w-full aspect-[4/5] object-cover rounded-[2.5rem] shadow-2xl border-4 border-emerald-500/20 grayscale-[0.2] hover:grayscale-0 transition-all duration-500"
                     />
                     <div className="absolute -bottom-4 -right-4 bg-gradient-to-r from-amber-400 to-amber-600 text-[#052e16] px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tighter shadow-xl border border-white/20">
                        Verified Scholar
                     </div>
                  </div>
               </div>
               <div className="flex-1 space-y-6 text-center md:text-left">
                  <div className="space-y-1">
                    <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em]">Lead Scholar Profile</p>
                    <h2 className="text-3xl md:text-5xl font-serif font-black text-white leading-tight">
                      Maulana Masood Raza Misbahi Farig
                    </h2>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-4 justify-center md:justify-start group/loc">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 group-hover/loc:bg-emerald-500/20 transition-colors shrink-0">
                           <Award className="text-emerald-400" size={24} />
                        </div>
                        <div className="text-left">
                           <div className="text-[10px] text-emerald-400/60 uppercase font-black tracking-widest">Education</div>
                           <span className="text-emerald-50 text-sm md:text-base font-bold leading-snug">Al Jamiatul Ashrafiya, Mubarakpur (Azamgarh)</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4 justify-center md:justify-start group/exp">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover/exp:bg-amber-500/20 transition-colors shrink-0">
                           <Clock className="text-amber-400" size={24} />
                        </div>
                        <div className="text-left">
                           <div className="text-[10px] text-amber-400/60 uppercase font-black tracking-widest">Experience</div>
                           <span className="text-emerald-50 text-sm md:text-base font-bold">5+ Years of Dedicated Teaching</span>
                        </div>
                     </div>
                  </div>
                  <div className="pt-6 border-t border-white/5 relative">
                    <p className="text-emerald-100/60 leading-relaxed italic text-sm md:text-lg font-serif">
                      "My mission is to ensure every child doesn't just read the Quran, but loves the journey of learning it. We focus on Tajweed, active engagement, and building a strong spiritual foundation."
                    </p>
                    <div className="absolute top-2 -left-2 text-emerald-500/10 font-serif text-6xl pointer-events-none">"</div>
                  </div>
               </div>
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
              { icon: <Map className="text-emerald-400" size={24}/>, title: "Journey of Light Map", desc: "A beautiful 30-node interactive map that tracks live session progress. Each class unlocks the next stage." },
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
                { text: "30 Live Scholar Sessions / month", highlight: true },
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
            <div className="space-y-2">
               <div className="flex items-center justify-center gap-4">
                  <span className="text-3xl text-emerald-100/30 line-through decoration-rose-500/50">₹999</span>
                  <div className="text-7xl font-black text-white">₹699<span className="text-2xl text-emerald-100/50">/month</span></div>
               </div>
               <p className="text-emerald-400 font-bold text-sm tracking-widest uppercase">Special Discounted Launch Price</p>
               <p className="text-emerald-200/40">Full access to live classes, journey map, and the entire gamification system.</p>
            </div>
            
            <div className="max-w-md mx-auto bg-white/5 p-8 rounded-[2rem] border border-white/10 backdrop-blur-md">
               <div className="space-y-4 mb-8">
                  {[
                    { label: "30 Live Scholar Sessions", value: "✓" },
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

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 10 — FAQs                        */}
      {/* ═══════════════════════════════════════ */}
      <section id="faqs" className="relative py-32 px-6 border-t border-white/5 bg-black/10">
         <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
               <p className="text-emerald-400 text-xs font-bold uppercase tracking-[0.3em]">Common Questions</p>
               <h2 className="text-4xl font-serif font-black text-white">Everything You Need to Know</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {[
                 {
                   q: "What is the mission of Tarbiyah?",
                   a: "Our mission is to provide quality education through an engaging class environment where every student stays active and involved throughout the session using our unique learning ecosystem."
                 },
                 {
                   q: "What does a typical session look like?",
                   a: "Each session follows a 4-step flow: **Revise** (review previous ayahs), **Practice** (independent study), **Observe** (earn XP by judging classmates' Tajweed), and **Recite** (live 1-on-1 with a scholar)."
                 },
                 {
                   q: "How does the XP and Leveling work?",
                   a: "Students earn XP for correct recitations and active engagement as an observer. Levels are designed to be achievable and rewarding—hitting 100 XP triggers a level-up, keeping motivation high."
                 },
                 {
                   q: "Why are the batches so small?",
                   a: "We limit batches to 5-8 students. this ensures every child gets multiple chances to recite live while maintaining a social environment that encourages friendly competition."
                 },
                 {
                   q: "Can I track my child's progress?",
                   a: "Yes! Every parent gets a dedicated dashboard showing live stats, attendance, Tajweed accuracy scores, and weekly progress reports."
                 },
                 {
                   q: "Is it suitable for beginners?",
                   a: "Absolutely. We have scholars trained for all levels, from Qaida to advanced Hifdh. Each child progresses at their own individual pace on their personal journey map."
                 }
               ].map((faq, i) => (
                 <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:border-emerald-500/30 transition-all">
                    <h3 className="text-lg font-bold text-emerald-400 mb-4 flex gap-3">
                       <HelpCircle size={18} className="shrink-0 mt-1" />
                       {faq.q}
                    </h3>
                     <p className="text-emerald-100/50 text-sm leading-relaxed">
                        {faq.a.split('**').map((part, index) => 
                          index % 2 === 1 ? <strong key={index} className="text-emerald-300">{part}</strong> : part
                        )}
                     </p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer spacer */}
      <div className="h-20"></div>
    </div>
  );
};
