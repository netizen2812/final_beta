
import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen, Heart, Sun, Cloud, Play, Lock, Sprout, Star,
  Trophy, Flame, Target, Sparkles, Leaf, Moon,
  ChevronLeft, X, CheckCircle, Award, Mic, Loader2, Users,
  Settings, Clock, TrendingUp, Shield, BarChart2, Calendar,
  Download, Share2, Bug, Globe, Feather
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { SubView, BADGES, COLORS, RANK_LEVELS, SCORING_RULES } from './TarbiyahData'; // JOURNEY_STAGES removed
import { calculateRank, RankCalculationResult } from '../utils/tarbiyahUtils';
import { useChildContext } from '../contexts/ChildContext';
import { tarbiyahService, ParentDashboardData } from '../services/tarbiyahService';
import { useAuth } from '@clerk/clerk-react';

// Icon Mapping Helper
const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Moon': return <Moon size={24} />;
    case 'Bug': return <Bug size={24} />;
    case 'Feather': return <Feather size={24} />;
    case 'Sparkles': return <Sparkles size={24} />;
    case 'Award': return <Award size={24} />;
    case 'Heart': return <Heart size={24} />;
    case 'Sun': return <Sun size={24} />;
    case 'Cloud': return <Cloud size={24} />;
    case 'Flame': return <Flame size={24} />;
    case 'Globe': return <Globe size={24} />;
    default: return <Star size={24} />;
  }
};

const MovingBackground = React.memo(() => {
  const particles = useMemo(() => {
    return [...Array(40)].map((_, i) => {
      const icons = [Moon, Star, BookOpen, Cloud, Sprout, Leaf, Sun];
      const Icon = icons[i % icons.length];
      const left = Math.random() * 100;
      const duration = 60 + Math.random() * 60;
      const delay = Math.random() * 60;
      const size = 16 + Math.random() * 32;
      const iconColors = ['#34d399', '#6ee7b7', '#fcd34d', '#a7f3d0', '#fbbf24'];
      const color = iconColors[Math.floor(Math.random() * iconColors.length)];
      return { Icon, left, duration, delay, size, color };
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#022c22]">
      <style>{`
        @keyframes float-calm {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          20% { opacity: 0.3; }
          80% { opacity: 0.3; }
          100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
        }
        .bg-icon-calm {
          position: absolute;
          opacity: 0;
          animation: float-calm linear infinite;
          will-change: transform;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      {particles.map((p, i) => (
        <div
          key={i}
          className="bg-icon-calm"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `-${p.delay}s`,
            fontSize: p.size,
            color: p.color
          }}
        >
          <p.Icon size={p.size} strokeWidth={1.5} />
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#022c22_95%)]"></div>
    </div>
  );
});

// Helper to wrap sub-views with the background
const WithBackground = ({ children }: { children: React.ReactNode }) => (
  <div className="relative min-h-screen text-white overflow-hidden pb-32 lg:pb-40">
    <MovingBackground />
    <div className="relative z-10 pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  </div>
);

const TarbiyahLearning: React.FC<{ onNavigateToProfile?: () => void }> = ({ onNavigateToProfile }) => {
  const [view, setView] = useState<'kids' | 'parent'>('kids');
  const [subView, setSubView] = useState<SubView>('main');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { children, activeChild, loading, setActiveChild, incrementProgress, refreshChildren } = useChildContext();
  const { getToken } = useAuth();

  const [lessons, setLessons] = useState<any[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(true);

  // ... (useEffect remains same)

  const handleCompletion = async (stage: any, xpEarned: number = 0) => {
    const finalXP = xpEarned > 0 ? xpEarned : 50;

    if (activeChild) {
      await incrementProgress(activeChild.id, finalXP);

      try {
        await tarbiyahService.saveLessonProgress({
          childUserId: activeChild.childUserId || activeChild.id,
          lessonId: stage.id,
          lessonTitle: stage.title,
          xpEarned: finalXP,
          completed: true,
          scores: { score: xpEarned, attemptDate: new Date() }
        }, getToken);

        // REFRESH children data to get the accurate 'lessons_completed' count from backend
        // This ensures the next lesson unlocks correctly based on actual unique completions
        await refreshChildren();

      } catch (e) {
        console.error("Failed to save lesson progress history", e);
      }
    }
    navigateTo('completion', { ...stage, earnedXP: finalXP });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#022c22] flex flex-col items-center justify-center space-y-4">
      <Loader2 className="animate-spin text-emerald-400" size={40} />
      <p className="text-emerald-100/50 font-bold uppercase tracking-widest text-xs">Journey Mapping...</p>
    </div>
  );

  if (children.length === 0) return (
    <div className="min-h-screen bg-[#022c22] flex flex-col items-center justify-center p-10 text-center space-y-8 animate-in fade-in">
      <div className="w-24 h-24 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-2xl">
        <Users size={48} />
      </div>
      <div>
        <h2 className="text-3xl font-serif font-bold text-white">No Child Profiles</h2>
        <p className="text-emerald-100/40 mt-4 max-w-xs mx-auto text-sm leading-relaxed mb-8">Visit the Profile tab to create a profile for your child and begin their learning adventure.</p>

        {onNavigateToProfile && (
          <button
            onClick={onNavigateToProfile}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-[#022c22] rounded-full font-bold uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105"
          >
            Add Child
          </button>
        )}
      </div>
    </div>
  );

  switch (subView) {
    case 'lesson-detail': return <WithBackground><LessonDetail stage={selectedItem} onNext={() => navigateTo('quiz', selectedItem)} onBack={() => setSubView('main')} /></WithBackground>;
    case 'quiz': return <WithBackground><QuizView stage={selectedItem} onComplete={(earned: number) => handleCompletion(selectedItem, earned)} onBack={() => navigateTo('lesson-detail', selectedItem)} /></WithBackground>;
    case 'completion': return <WithBackground><CompletionSplash stage={selectedItem} onFinish={() => setSubView('main')} /></WithBackground>;
    case 'achievements': return <WithBackground><AchievementsShowcase onBack={() => setSubView('main')} onNavigate={navigateTo} /></WithBackground>;
    case 'limit-edit': return <WithBackground><LimitEdit onBack={() => setSubView('main')} /></WithBackground>;
    default: return (
      <div className="relative min-h-screen text-white overflow-hidden pb-32 lg:pb-40">
        <MovingBackground />

        {subView === 'main' && (
          <div className="fixed top-20 left-0 w-full z-40 px-4 sm:px-6 lg:px-8 py-3 pointer-events-none">
            <div className="max-w-5xl mx-auto flex justify-between items-start">
              <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-full p-1 shadow-lg border border-white/10 inline-flex ring-1 ring-white/5">
                <button
                  onClick={() => setView('kids')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'kids' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white'}`}
                >
                  Kids Mode
                </button>
                <button
                  onClick={() => setView('parent')}
                  className={`px-4 sm:px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'parent' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-200 hover:text-white'}`}
                >
                  Parents Area
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 pt-4 sm:pt-6 lg:pt-8 px-4 sm:px-6 lg:px-8">
          {view === 'kids' ? (
            <KidsMain
              scrollProgress={scrollProgress}
              onNavigate={navigateTo}
              activeChild={activeChild}
              children={children}
              onChildChange={(id) => setActiveChild(id)}
              lessons={lessons}
              lessonsLoading={lessonsLoading}
            />
          ) : (
            <ParentsView onNavigate={navigateTo} activeChild={activeChild} />
          )}
        </div>
      </div>
    );
  }
};

const KidsMain: React.FC<{
  scrollProgress: number,
  onNavigate: (v: SubView, i?: any) => void,
  activeChild: any,
  children: any[],
  onChildChange: (id: string) => void,
  lessons: any[],
  lessonsLoading: boolean
}> = ({ scrollProgress, onNavigate, activeChild, children, onChildChange, lessons, lessonsLoading }) => {
  const { getToken } = useAuth();

  // Use shared utility for consistent rank calculation
  const progress = activeChild?.child_progress?.[0] || { xp: 0, lessons_completed: 0 };
  const rankData: RankCalculationResult = calculateRank(progress.xp);
  const { currentRank, nextRank, xpIntoRank, xpToNext, progressPercent } = rankData;

  const stagesWithStatus = lessons.map((s, idx) => ({
    ...s,
    completed: idx < progress.lessons_completed,
    locked: idx > progress.lessons_completed
  }));

  const maxCompletedIdx = progress.lessons_completed;
  const pathFillPercentage = Math.min(100, (maxCompletedIdx / (lessons.length - 1)) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10 lg:space-y-12">
      {/* Profile Header Card */}
      <div className="relative overflow-hidden bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-white/10 ring-1 ring-white/5 group transition-all hover:bg-white/10">

        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

        {children.length > 1 && (
          <div className="flex justify-center gap-2 mb-6 pointer-events-auto relative z-10">
            {children.map(c => (
              <button
                key={c.id}
                onClick={() => onChildChange(c.id)}
                className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border ${activeChild?.id === c.id ? 'bg-emerald-500 text-[#022c22] border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-emerald-200/50 border-white/5 hover:bg-white/10'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">

          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-cyan-400 p-[3px] shadow-[0_0_40px_rgba(16,185,129,0.3)] animate-pulse">
              <div className="w-full h-full rounded-full bg-[#022c22] flex items-center justify-center border-4 border-[#064e3b] relative overflow-hidden group-hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/0 to-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-[36px] sm:text-[42px] drop-shadow-2xl filter saturate-150 transform transition-transform group-hover:rotate-6">{currentRank.icon}</div>
              </div>
            </div>
            {/* Rank Level Badge */}
            <div className="absolute -bottom-2 -right-2 bg-[#022c22] text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/30 shadow-lg">
              Lvl {currentRank.level}
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 w-full text-center sm:text-left space-y-4">

            <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight drop-shadow-md">{activeChild?.name}</h2>
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1 opacity-80">{currentRank.title}</p>
              </div>

              {/* Stats Chips */}
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-300 rounded-xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <Flame size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{progress.xp} XP</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 text-indigo-300 rounded-xl border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs font-bold">{progress.lessons_completed} Done</span>
                </div>
              </div>
            </div>

            {/* Progress Bar Container */}
            <div className="bg-black/20 rounded-2xl p-4 border border-white/5 backdrop-blur-sm relative overflow-hidden">
              <div className="flex justify-between text-[10px] font-bold text-emerald-200/60 uppercase tracking-wider mb-2">
                <span>Current Progress</span>
                {nextRank ? <span>{xpToNext} XP to {nextRank.title}</span> : <span className="text-emerald-400">Max Rank Achieved!</span>}
              </div>

              {/* Modern Progress Bar */}
              <div className="h-4 bg-[#0a1f18] rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                {/* Background Pinstripes */}
                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 11px)' }}></div>

                {/* Active Bar */}
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)] relative"
                  style={{ width: `${progressPercent}%`, transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'shimmer 2s infinite', backgroundSize: '200% 100%' }}></div>
                </div>
              </div>

              <div className="flex justify-between mt-2 text-[9px] font-medium text-white/30">
                <span>Lvl {currentRank.level}</span>
                <span>{nextRank ? `Lvl ${nextRank.level}` : 'Top Rank'}</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div className="relative py-8 sm:py-12 lg:py-16">
        <h3 className="text-center font-serif text-2xl sm:text-3xl font-bold text-white mb-12 sm:mb-16 flex items-center justify-center gap-3 sm:gap-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100">
          <Sparkles size={20} className="text-emerald-400" />
          Your Journey of Light
          <Sparkles size={20} className="text-emerald-400" />
        </h3>
        <div className="absolute left-1/2 -translate-x-1/2 top-24 sm:top-32 bottom-0 w-1 bg-white/10 rounded-full">
          <div className="w-full bg-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_20px_#10b981]" style={{ height: `${pathFillPercentage}%` }} />
        </div>
        <div className="space-y-12 sm:space-y-24 relative z-10">
          {stagesWithStatus.map((stage, idx) => {
            const isRight = idx % 2 !== 0; // True for Odd (Right on Desktop)

            // Mobile: Even = Left Node / Right Content. Odd = Right Node / Left Content.
            // Desktop: Alternates around center.

            return (
              <div key={stage.id} className="flex flex-col sm:block relative group">

                {/* 📌 NODE (The Circle) */}
                <div className={`absolute top-1/2 -translate-y-1/2 z-20 
                  w-12 h-12 sm:w-14 sm:h-14 rounded-full border-4 border-[#022c22] 
                  flex items-center justify-center transition-all duration-500 shadow-xl
                  ${isRight
                    ? 'right-4 sm:left-1/2 sm:-translate-x-1/2'  // Mobile: Right, Desktop: Center
                    : 'left-4 sm:left-1/2 sm:-translate-x-1/2'   // Mobile: Left, Desktop: Center
                  }
                  ${stage.locked
                    ? 'bg-gray-800 text-gray-500 border-gray-700'
                    : stage.completed
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-[#022c22] scale-110 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
                      : 'bg-white text-emerald-600 animate-pulse shadow-[0_0_30px_white]'
                  }`}
                >
                  {stage.locked ? <Lock size={16} /> : stage.completed ? <CheckCircle size={20} /> : <div className="text-xl font-black">{idx + 1}</div>}
                </div>

                {/* 📄 CARD CONTENT */}
                {/* 
                   Mobile Logic:
                   - Even (isRight=false): Content on Right (pl-20)
                   - Odd (isRight=true): Content on Left (pr-20)
                   
                   Desktop Logic (sm:):
                   - Standard alternating (50% width, margin auto)
                */}
                <div className={`w-full sm:w-[45%] transition-all duration-500
                  ${isRight
                    ? 'pr-20 pl-4 text-right sm:text-left sm:pr-0 sm:pl-12 lg:pl-20 sm:ml-auto' // Mobile: Push Left (pr-20)
                    : 'pl-20 pr-4 text-left sm:text-right sm:pl-0 sm:pr-12 lg:pr-20 sm:mr-auto' // Mobile: Push Right (pl-20)
                  }
                `}>
                  <div className={`backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-5 sm:p-6 lg:p-8 border transition-all duration-300 relative overflow-hidden ${stage.locked ? 'bg-white/5 border-white/5 opacity-60 grayscale-[0.8]' : 'bg-white/10 border-white/20 shadow-2xl hover:bg-white/15 hover:border-emerald-400/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)] hover:scale-[1.03]'}`}>
                    {!stage.locked && (
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    )}

                    {/* Header: Title & XP */}
                    <div className={`flex flex-col gap-2 mb-3 relative z-10
                      ${isRight
                        ? 'items-end sm:flex-row sm:items-start sm:justify-between'
                        : 'items-start sm:flex-row-reverse sm:justify-between'
                      }
                    `}>
                      <div className={`flex-1 ${!isRight ? 'sm:text-right' : ''}`}>
                        <h4 className="font-bold text-lg sm:text-xl text-white mb-1 leading-tight">{stage.title}</h4>
                        <p className="text-xs sm:text-sm text-emerald-200/80">{stage.subtitle}</p>
                      </div>
                      {!stage.locked && <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] bg-amber-500/20 text-amber-300 px-2 sm:px-3 py-1 rounded-full font-bold border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"><Trophy size={12} /> +{stage.xpReward} XP</span>}
                    </div>

                    {!stage.locked && (
                      <button onClick={() => {
                        const start = async () => {
                          try {
                            await tarbiyahService.startLesson({
                              childUserId: activeChild.childUserId || activeChild.id,
                              lessonId: stage.id,
                              lessonTitle: stage.title
                            }, getToken);
                            onNavigate('lesson-detail', stage);
                          } catch (e: any) {
                            alert(e.message || "Cannot start lesson");
                          }
                        };
                        start();
                      }} className={`w-full py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg relative z-10 ${stage.completed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-emerald-500 hover:bg-emerald-400 text-[#022c22] shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)]'}`}>
                        {stage.completed ? 'Replay Lesson' : 'Play Lesson'} <Play size={14} fill="currentColor" />
                      </button>
                    )}

                    {stage.locked && <div className={`text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2 bg-black/20 py-2 rounded-lg mt-3 ${isRight ? 'justify-end sm:justify-start' : 'justify-start sm:justify-end'}`}><Lock size={12} /> Locked</div>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const LessonDetail = ({ stage, onNext, onBack }: any) => {
  const { getToken } = useAuth();
  const { activeChild } = useChildContext();

  const handleBack = async () => {
    // Track exit
    try {
      if (activeChild) {
        await tarbiyahService.saveLessonProgress({
          childUserId: activeChild.childUserId || activeChild.id,
          lessonId: stage.id,
          lessonTitle: stage.title,
          xpEarned: 0,
          completed: false,
          exitSession: true
        }, getToken);
      }
    } catch (e) {
      console.error("Failed to track exit", e);
    }
    onBack();
  };

  return (
    <div className="pt-8 sm:pt-12 lg:pt-16 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-500">
      <button onClick={handleBack} className="flex items-center gap-2 text-emerald-400 font-bold mb-6 sm:mb-8 hover:text-white transition-colors"><ChevronLeft size={20} /> Back to Map</button>
      <div className="bg-white/10 backdrop-blur-2xl rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-6 sm:p-10 lg:p-16 border border-white/20 shadow-2xl relative overflow-hidden space-y-8 sm:space-y-10">
        <div className="absolute top-0 right-0 p-8 sm:p-12 opacity-10 text-emerald-300 group-hover:scale-110 transition-transform">
          <Sun size={80} sm:size={120} />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">Lesson Activity</div>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-serif font-bold text-white leading-tight">{stage.title}</h1>
          <p className="text-lg sm:text-xl text-emerald-100/80 leading-relaxed max-w-2xl">{stage.description}</p>
        </div>

        <div className="aspect-video bg-black/40 rounded-[2rem] border-2 border-dashed border-white/10 overflow-hidden shadow-2xl">
          {stage.videoUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={stage.videoUrl}
              title={stage.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl"><Play size={24} fill="currentColor" /></div>
              <span className="mt-4 text-xs font-bold text-white/40">Video Unavailable</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center text-amber-900 shadow-lg">
              <Trophy size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Reward</p>
              <p className="text-white font-bold">{stage.xpReward || 50} XP base + Quiz Bonus</p>
            </div>
          </div>
        </div>

        <button onClick={onNext} className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-[#022c22] rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
          Start Quiz Challenge
        </button>
      </div>
    </div>
  );
};

const QuizView = ({ stage, onComplete, onBack }: any) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);

  const [questionAttempts, setQuestionAttempts] = useState<{ [key: number]: number }>({});
  const [pointsEarned, setPointsEarned] = useState(0);

  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const question = stage.mcqs ? stage.mcqs[currentQ] : null;

  const handleAnswer = (option: string) => {
    if (!question) return;

    const attempts = (questionAttempts[currentQ] || 0) + 1;
    setQuestionAttempts(prev => ({ ...prev, [currentQ]: attempts }));

    const isCorrect = option === question.answer;

    if (isCorrect) {
      setFeedback('correct');
      setScore(s => s + 1);

      let pts = 0;
      if (attempts === 1) pts = SCORING_RULES.CORRECT_1ST_TRY;
      else if (attempts === 2) pts = SCORING_RULES.CORRECT_2ND_TRY;

      setPointsEarned(prev => prev + pts);

      setTimeout(() => {
        setFeedback(null);
        if (currentQ < (stage.mcqs?.length || 0) - 1) {
          setCurrentQ(q => q + 1);
        } else {
          setShowResult(true);
        }
      }, 1500);

    } else {
      setFeedback('wrong');
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const totalQuestions = stage.mcqs?.length || 0;
  const isPerfect = score === totalQuestions && Object.values(questionAttempts).every(a => a === 1);
  const finalBonus = isPerfect ? SCORING_RULES.PERFECT_BONUS : 0;
  const baseReward = stage.xpReward || 50;
  const totalLessonXP = baseReward + pointsEarned + finalBonus;

  const handleFinish = () => {
    onComplete(totalLessonXP);
  };

  if (!question || showResult) {
    return (
      <div className="min-h-screen bg-[#022c22] flex items-center justify-center p-6 text-center animate-in fade-in">
        <div className="max-w-xl w-full space-y-8">
          <div className="w-32 h-32 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center">
            {score === stage.mcqs?.length ? <Award size={64} className="text-emerald-400" /> : <BookOpen size={64} className="text-emerald-400" />}
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-bold text-white">Quiz Completed!</h2>
            <p className="text-emerald-100/50 text-xl">You got {score} out of {stage.mcqs?.length} correct.</p>
          </div>

          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <div className="flex justify-between text-sm text-emerald-200/60 font-bold uppercase tracking-widest">
              <span>Lesson Base XP</span>
              <span>{baseReward}</span>
            </div>
            <div className="flex justify-between text-sm text-emerald-200/60 font-bold uppercase tracking-widest">
              <span>Quiz Score XP</span>
              <span>{pointsEarned}</span>
            </div>
            {isPerfect && (
              <div className="flex justify-between text-sm text-amber-400 font-bold uppercase tracking-widest">
                <span>Perfect Bonus 🎯</span>
                <span>+{finalBonus}</span>
              </div>
            )}
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-xl text-white font-black uppercase tracking-widest">
              <span>Total Earned</span>
              <span className="text-emerald-400">+{totalLessonXP} XP</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {score === stage.mcqs?.length ? (
              <button onClick={handleFinish} className="w-full py-6 rounded-[2rem] bg-emerald-500 text-[#022c22] font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                Claim Reward & Unlock Next Lesson
              </button>
            ) : (
              <button onClick={onBack} className="w-full py-6 rounded-[2rem] bg-white/10 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/20 transition-all">
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#022c22]">
      <div className="max-w-2xl w-full space-y-8 animate-in slide-in-from-right-8 duration-300">
        <div className="flex justify-between items-center text-xs font-bold text-emerald-400 tracking-widest uppercase mb-4">
          <span>Question {currentQ + 1} / {stage.mcqs.length}</span>
          <span>{stage.title}</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${((currentQ + 1) / stage.mcqs.length) * 100}%` }} />
        </div>

        <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 border border-white/20 text-center space-y-8 relative overflow-hidden">
          {feedback && (
            <div className={`absolute inset-0 z-50 flex items-center justify-center backdrop-blur-md transition-all ${feedback === 'correct' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              <div className={`transform scale-150 ${feedback === 'correct' ? 'text-emerald-400' : 'text-red-400'}`}>
                {feedback === 'correct' ? <CheckCircle size={80} fill="currentColor" className="text-white" /> : <X size={80} />}
                <p className="text-lg font-black uppercase tracking-widest mt-4 text-white shadow-black drop-shadow-lg">
                  {feedback === 'correct' ? 'Masha\'Allah!' : 'Try Again'}
                </p>
                {feedback === 'correct' && <p className="text-xs text-emerald-200 mt-2 font-serif italic">{question.reference}</p>}
              </div>
            </div>
          )}

          <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">{question.q}</h3>

          <div className="grid grid-cols-1 gap-4 mt-8">
            {question.options.map((opt: string, idx: number) => (
              <button
                key={idx}
                onClick={() => handleAnswer(opt)}
                className="w-full py-4 px-6 rounded-2xl bg-white/5 hover:bg-white/10 border-2 border-transparent hover:border-emerald-500/50 text-emerald-100 font-medium text-lg transition-all active:scale-95 text-left flex items-center gap-4 group"
              >
                <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-white/40 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                  {String.fromCharCode(65 + idx)}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>

        <button onClick={onBack} className="w-full text-white/20 hover:text-white/40 text-xs font-bold uppercase tracking-widest transition-colors">
          Exit Quiz
        </button>
      </div>
    </div>
  );
};

const CompletionSplash = ({ stage, onFinish }: any) => (
  <div className="min-h-screen flex items-center justify-center text-center p-6 bg-[#022c22]">
    <div className="max-w-md space-y-10 animate-in zoom-in duration-700">
      <div className="w-40 h-40 bg-gradient-to-tr from-amber-300 to-amber-500 rounded-[3rem] flex items-center justify-center mx-auto shadow-[0_0_80px_rgba(251,191,36,0.4)] rotate-12 border-4 border-amber-200">
        <Trophy size={64} className="text-[#78350f] -rotate-12 drop-shadow-lg" />
      </div>
      <div className="space-y-4">
        <h1 className="text-5xl font-black text-white tracking-tight">Masha'Allah!</h1>
        <p className="text-emerald-200/60 text-lg font-medium">You completed <span className="text-white font-bold">{stage.title}</span></p>

        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 rounded-full border border-white/10 mt-4 backdrop-blur-md">
          <Sparkles className="text-amber-400" size={20} />
          <span className="text-xl font-black text-white">+{stage.earnedXP || 0} XP Earned</span>
        </div>
      </div>
      <button onClick={onFinish} className="w-full py-6 bg-emerald-500 hover:bg-emerald-400 text-[#022c22] rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">
        Continue Journey
      </button>
    </div>
  </div>
);

const ParentsView: React.FC<{ onNavigate: (v: SubView, i?: any) => void, activeChild: any }> = ({ onNavigate, activeChild }) => {
  const progress = activeChild?.child_progress?.[0] || { xp: 0, level: 1, lessons_completed: 0 };
  const { getToken } = useAuth();
  const [dashboardData, setDashboardData] = useState<ParentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (activeChild?.id) {
        try {
          setLoading(true);
          // Always use the Child Document ID (activeChild.id) for the dashboard endpoint
          const data = await tarbiyahService.getParentDashboard(activeChild.id, getToken);
          setDashboardData(data);
        } catch (error) {
          console.error("Failed to fetch dashboard data", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [activeChild?.id, activeChild?.childUserId]);

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-400" size={40} />
      </div>
    )
  }

  const topicData = dashboardData.topicBreakdown || [];

  return (
    <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto relative z-10">

      <div className="mb-10 sm:mb-12 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
          <Shield size={12} /> Parent Dashboard
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-md">{activeChild?.name}'s Progress</h1>
        <p className="text-emerald-200 mt-3 text-base sm:text-lg">Monitor growth, set limits, and explore curriculum.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-10">
        <div className="bg-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-2xl border border-white/20 ring-1 ring-white/5 group hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-emerald-400">
            <div className="p-2 bg-emerald-400/10 rounded-full">
              <Clock size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-emerald-200/70">Time This Week</span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-white drop-shadow-sm">{dashboardData.timeThisWeek.total}</div>
          <div className="text-xs text-emerald-400 font-bold flex items-center gap-1 mt-3 bg-emerald-400/10 inline-flex px-3 py-1 rounded-full border border-emerald-400/20">
            <TrendingUp size={12} /> {dashboardData.timeThisWeek.percentChange} {dashboardData.timeThisWeek.comparisonText}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-2xl border border-white/20 ring-1 ring-white/5 group hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-blue-400">
            <div className="p-2 bg-blue-400/10 rounded-full">
              <CheckCircle size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-blue-200/70">Lessons Done</span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-white drop-shadow-sm">{dashboardData.lessonsDone.completed}</div>
          <div className="text-xs text-blue-200/50 font-bold mt-3 pl-1">
            {dashboardData.lessonsDone.total - dashboardData.lessonsDone.completed} remaining
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-2xl border border-white/20 ring-1 ring-white/5 group hover:bg-white/15 transition-all duration-300">
          <div className="flex items-center gap-3 mb-3 text-purple-400">
            <div className="p-2 bg-purple-400/10 rounded-full">
              <Target size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-purple-200/70">Current XP</span>
          </div>
          <div className="text-3xl sm:text-4xl font-serif font-bold text-white drop-shadow-sm">{dashboardData.currentXP}</div>
          <div className="text-xs text-purple-300 font-bold mt-3 bg-purple-400/10 inline-flex px-3 py-1 rounded-full border border-purple-400/20">
            Level {dashboardData.currentLevel}
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-900/80 to-[#022c22] backdrop-blur-2xl p-5 sm:p-6 rounded-[2rem] shadow-2xl border border-emerald-500/30 ring-1 ring-emerald-500/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Award size={80} className="text-emerald-400" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3 text-emerald-400">
              <div className="p-2 bg-emerald-400/10 rounded-full border border-emerald-400/20">
                <Award size={18} />
              </div>
              <span className="text-xs font-black uppercase tracking-widest text-emerald-100/70">Badges</span>
            </div>
            <div className="text-3xl sm:text-4xl font-serif font-bold text-white drop-shadow-md mb-2">{dashboardData.totalBadges.count}</div>
            <button onClick={() => onNavigate('achievements')} className="text-[10px] font-black uppercase tracking-widest text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500 hover:text-[#022c22] px-4 py-2 rounded-full border border-emerald-500/30 transition-all shadow-lg active:scale-95 flex items-center gap-2 w-fit">
              View Showcase <ChevronLeft className="rotate-180" size={12} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
        {/* Charts and logs refined */}
        <div className="bg-white/10 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white/20 ring-1 ring-white/5 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
          <h3 className="font-serif font-bold text-white text-xl mb-6 sm:mb-8 flex justify-between items-center relative z-10">Total Progress <BarChart2 size={20} className="text-emerald-400" /></h3>
          <div className="h-48 sm:h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topicData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {topicData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke={index === 0 ? "rgba(16,185,129,0.5)" : "transparent"} strokeWidth={index === 0 ? 4 : 0} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#064e3b', borderColor: '#34d399', color: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }} itemStyle={{ fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 text-xs font-bold text-emerald-100/60 mt-4 sm:mt-6 relative z-10 uppercase tracking-wider">
            {topicData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                <span className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: item.fill, boxShadow: `0 0 10px ${item.fill}` }}></span>
                {item.name}: {item.value}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-2xl p-6 sm:p-8 rounded-[2.5rem] shadow-2xl border border-white/20 ring-1 ring-white/5 lg:col-span-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-900/20 to-transparent pointer-events-none"></div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8 relative z-10">
            <h3 className="font-serif font-bold text-white text-xl">Activity Log</h3>
            <div className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 rounded-full py-2 px-4 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              Last 7 Days
            </div>
          </div>
          <div className="h-48 sm:h-64 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.activityLog.days.map((day, i) => ({ day, min: dashboardData.activityLog.minutes[i] }))}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6ee7b7', fontWeight: 'bold' }} dy={10} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)', radius: 8 }}
                  contentStyle={{ backgroundColor: '#064e3b', borderColor: '#34d399', color: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                />
                <Bar dataKey="min" fill="#10b981" radius={[8, 8, 8, 8]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-[#022c22]/60 backdrop-blur-2xl rounded-[2.5rem] p-6 sm:p-10 border border-white/10 ring-1 ring-white/5 shadow-2xl">
        <h3 className="font-serif font-bold text-white mb-8 flex items-center gap-4 text-2xl">
          <div className="p-3 bg-emerald-500/20 rounded-full text-emerald-400 border border-emerald-500/30">
            <Settings size={28} />
          </div>
          Settings & Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="flex items-center justify-between bg-white/5 p-5 sm:p-6 rounded-[2rem] border border-white/10 hover:border-emerald-500/30 hover:bg-white/10 transition-all group">
            <div>
              <div className="text-sm font-black uppercase tracking-widest text-white mb-1">Daily Limit</div>
              <div className="text-xs text-emerald-200/60 font-medium">Currently: <span className="text-white font-bold">{dashboardData.settings.dailyLimitMinutes} mins</span></div>
            </div>
            <button onClick={() => onNavigate('limit-edit')} className="text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/20 hover:text-white px-5 py-3 rounded-full text-emerald-200 transition-all border border-white/5 group-hover:border-white/20">Edit</button>
          </div>
        </div>
      </div>

    </div>
  );
};

const AchievementsShowcase = ({ onBack, onNavigate }: any) => {
  const { activeChild } = useChildContext();
  const progress = activeChild?.child_progress?.[0] || { xp: 0 };
  const { currentRank } = calculateRank(progress.xp);

  // Filter only earned badges
  const earnedBadges = RANK_LEVELS.filter(rank => progress.xp >= rank.minXP);

  return (
    <div className="pt-24 sm:pt-28 lg:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-indigo-400 font-bold mb-6 sm:mb-8 hover:text-white transition-colors"><ChevronLeft /> Back to Dashboard</button>
      <div className="space-y-10 sm:space-y-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
          <h2 className="text-4xl sm:text-5xl font-serif font-bold text-white">Showcase</h2>
          <div className="text-right">
            <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">Current Rank</p>
            <p className="text-2xl font-black text-white">{currentRank.title}</p>
          </div>
        </div>

        {earnedBadges.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5">
            <Lock size={48} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/40 font-bold">Start your journey to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {earnedBadges.map((rank) => (
              <div key={rank.level} className="aspect-square rounded-[2rem] sm:rounded-[3rem] border-2 border-dashed border-indigo-500/30 flex flex-col items-center justify-center p-6 sm:p-8 transition-all hover:scale-105 cursor-pointer bg-indigo-600/20">
                <div className="text-4xl sm:text-5xl mb-4">{rank.icon}</div>
                <div className="text-xs font-black text-indigo-300 uppercase tracking-widest text-center">{rank.title}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const LimitEdit = ({ onBack }: any) => (
  <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
    <div className="max-w-md w-full bg-white/10 backdrop-blur-3xl p-8 sm:p-12 rounded-[3rem] sm:rounded-[4rem] border border-white/20 shadow-2xl space-y-10 sm:space-y-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/20 text-indigo-300 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-center mx-auto"><Clock size={36} /></div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white">Daily Screen Limit</h2>
        <p className="text-indigo-200/60 font-medium text-sm sm:text-base">Control digital consumption for balanced learning.</p>
      </div>
      <div className="space-y-8">
        <div className="relative pt-1">
          <input type="range" className="w-full h-2 bg-black/40 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
          <div className="flex justify-between mt-4 text-[10px] font-black uppercase text-indigo-300 tracking-widest">
            <span>15 min</span>
            <span className="text-white bg-indigo-600 px-3 py-1 rounded-full text-xs">45 mins</span>
            <span>120 min</span>
          </div>
        </div>
        <div className="p-5 sm:p-6 bg-white/5 rounded-2xl border border-white/5 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-200">Weekend Buffer</span>
            <div className="w-10 h-6 bg-indigo-600 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1" /></div>
          </div>
          <p className="text-[10px] text-white/30 font-medium">Adds 15 mins automatically on Fri-Sat.</p>
        </div>
      </div>
      <button onClick={onBack} className="w-full py-5 sm:py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] sm:text-[12px] shadow-2xl active:scale-95 transition-all">Save Preferences</button>
    </div>
  </div>
);

export default TarbiyahLearning;
