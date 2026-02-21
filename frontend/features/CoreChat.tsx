import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, ChevronDown, CloudRain, Sun, Smile,
  AlertTriangle, SlidersHorizontal, X, Sparkles,
  ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import { Madhab, ChatMessage, Tone, Conversation } from '../types';
import { getImamResponse } from '../geminiService';
import { useAuth } from "@clerk/clerk-react";
import LeftContextPanel from '../components/LeftContextPanel';
import GuidanceControlPanel from '../components/RightUtilityPanel';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Animated Background ────────────────────────────────────────────────────
const AnimatedBackground: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden"
    style={{ zIndex: 0 }}
    aria-hidden="true"
  >
    {/* Deep atmospheric base */}
    <div className="absolute inset-0 bg-gradient-to-b from-[#Fdfcf8] via-[#F1F8F5] to-[#E3F2ED]" />

    {/* Warm ivory glow center */}
    <div
      className="absolute top-[-10%] left-[20%] w-[70vw] h-[70vw] rounded-full mix-blend-multiply filter blur-[80px] opacity-60"
      style={{
        background: 'radial-gradient(circle, rgba(255,253,240,0.8) 0%, rgba(255,255,255,0) 70%)',
        animation: 'pulseGlow 8s ease-in-out infinite alternate',
      }}
    />

    {/* Soft teal diffusion */}
    <div
      className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full mix-blend-multiply filter blur-[100px] opacity-40"
      style={{
        background: 'radial-gradient(circle, rgba(167,243,208,0.4) 0%, rgba(255,255,255,0) 70%)',
        animation: 'driftTeal 15s ease-in-out infinite alternate',
      }}
    />

    {/* Floating particles */}
    {[...Array(18)].map((_, i) => (
      <div
        key={i}
        className="absolute rounded-full bg-emerald-900/10"
        style={{
          width: `${3 + (i % 5) * 2}px`,
          height: `${3 + (i % 5) * 2}px`,
          left: `${5 + i * 5.5}%`,
          top: `${10 + ((i * 43) % 85)}%`,
          animation: `floatParticle ${18 + (i % 7) * 4}s ease-in-out infinite`,
          animationDelay: `${i * 0.8}s`,
          willChange: 'transform',
        }}
      />
    ))}
    <style>{`
      @keyframes pulseGlow {
        0%   { transform: scale(1); opacity: 0.5; }
        100% { transform: scale(1.1); opacity: 0.7; }
      }
      @keyframes driftTeal {
        0%   { transform: translate(0, 0); }
        100% { transform: translate(-30px, -20px); }
      }
      @keyframes floatParticle {
        0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
        50%       { transform: translateY(-25px) translateX(10px); opacity: 0.6; }
      }
      @media (prefers-reduced-motion: reduce) {
        * { animation: none !important; }
      }
    `}</style>
  </div>
);

// ─── Formatted Message Content ───────────────────────────────────────────────
const FormattedContent: React.FC<{ content: string }> = ({ content }) => {
  const cleanContent = content.replace(/[*#_`~]/g, '').trim();
  const segments = cleanContent.split('\n').filter(Boolean);
  return (
    <div className="w-full space-y-3">
      {segments.map((segment, idx) => {
        const isHeader = segment.length < 50 && segment === segment.toUpperCase() && segment.length > 2;
        const isQuranVerse = segment.includes('Quran') || segment.includes('Surah') || segment.includes('Ayah');
        if (isHeader) return (
          <h4 key={idx} className="text-xs font-black uppercase tracking-[0.15em] text-[#052e16] mb-1 mt-5 first:mt-0 opacity-90">{segment}</h4>
        );
        if (isQuranVerse) return (
          <div key={idx} className="my-4 pl-5 border-l-4 border-emerald-200/60 py-2.5 bg-emerald-50/30 rounded-r-xl pr-4">
            <p className="text-base leading-loose text-slate-800 font-serif italic">{segment}</p>
          </div>
        );
        return <p key={idx} className="text-[15px] leading-relaxed text-slate-700">{segment}</p>;
      })}
    </div>
  );
};

// ─── Typing Indicator ────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex justify-start animate-in fade-in duration-300">
    <div className="bg-white/80 backdrop-blur-sm px-5 py-3.5 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1.5 items-center shadow-sm">
      {[0, 150, 300].map((delay) => (
        <div key={delay} className="w-2 h-2 bg-[#052e16]/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
      ))}
    </div>
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onPrompt: (q: string) => void }> = ({ onPrompt }) => {
  const prompts = [
    { emoji: '🤲', text: 'How should I prepare for Salah?' },
    { emoji: '📖', text: 'Explain the meaning of Surah Al-Fatiha' },
    { emoji: '💚', text: 'Tell me a story about patience (Sabr)' },
    { emoji: '🌙', text: 'What is the significance of Ramadan?' },
  ];
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 max-w-lg mx-auto text-center space-y-8 animate-in zoom-in-95 duration-700">
      <div className="relative">
        <div className="w-24 h-24 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[2rem] flex items-center justify-center shadow-inner border border-emerald-100">
          <Sparkles size={44} className="text-[#052e16]/70" />
        </div>
        <div className="absolute -inset-3 rounded-[2.5rem] border border-emerald-100/60 animate-pulse" />
      </div>
      <div className="space-y-3">
        <h3 className="text-3xl font-serif font-bold text-[#052e16]">As-salamu alaykum</h3>
        <p className="text-sm leading-relaxed text-slate-500 max-w-xs mx-auto">
          I am here to offer guidance rooted in the Quran, Sunnah, and your chosen school of thought.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPrompt(p.text)}
            className="flex items-center gap-3 px-4 py-3.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl hover:border-emerald-200 hover:bg-emerald-50/50 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group"
          >
            <span className="text-lg">{p.emoji}</span>
            <span className="text-xs font-semibold text-slate-600 group-hover:text-[#052e16] leading-snug">{p.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── Props ───────────────────────────────────────────────────────────────────
interface CoreChatProps {
  madhab: Madhab;
  setMadhab: (m: Madhab) => void;
  tone: Tone;
  setTone: (t: Tone) => void;
}

// ─── Main Component ──────────────────────────────────────────────────────────
const CoreChat: React.FC<CoreChatProps> = ({ madhab, setMadhab, tone: mood, setTone: setMood }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [isLargeDesktop, setIsLargeDesktop] = useState(window.innerWidth >= 1440);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsLargeDesktop(window.innerWidth >= 1440);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // ── Fetch conversation list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: Conversation[] = await res.json();
        setConversations(data);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsHistoryLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // getToken is stable from Clerk — intentionally omitted to prevent re-render loop

  useEffect(() => { fetchConversations(); }, []); // run once on mount

  // ── Create new conversation ──────────────────────────────────────────────
  const handleNewChat = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/conversations`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const conv: Conversation = await res.json();
        setConversations(prev => [conv, ...prev]);
        setActiveConversationId(conv._id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create conversation:', err);
      // Fallback: just clear messages
      setActiveConversationId(null);
      setMessages([]);
    }
  };

  // ── Load conversation messages ───────────────────────────────────────────
  const handleSelectConversation = async (id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
    setMessages([]);
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const conv = await res.json();
        const loaded: ChatMessage[] = conv.messages.map((m: any) => ({
          id: m._id || String(Math.random()),
          role: m.role,
          text: m.content,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(loaded);
      }
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Delete conversation ──────────────────────────────────────────────────
  const handleDeleteConversation = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_URL}/api/conversations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(prev => prev.filter(c => c._id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // ── Send message ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Ensure we have an active conversation
    let convId = activeConversationId;
    if (!convId) {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/api/conversations`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const conv: Conversation = await res.json();
          convId = conv._id;
          setActiveConversationId(conv._id);
          setConversations(prev => [conv, ...prev]);
        }
      } catch (err) {
        console.error('Failed to create conversation for send:', err);
      }
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = await getToken();
      const apiHistory = messages.map(m => ({ role: m.role, text: m.text }));
      const aiResponse = await getImamResponse(input, madhab, mood, apiHistory, token, convId ?? undefined);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: aiResponse,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Refresh conversation list to get updated title
      fetchConversations();
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered an error while reflecting. Please try again. Allah knows best.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopicClick = (query: string) => setInput(query);

  const moodOptions = [
    { icon: <Sun size={20} />, label: Tone.PEACEFUL, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    { icon: <Smile size={20} />, label: Tone.GRATEFUL, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { icon: <CloudRain size={20} />, label: Tone.LOW, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
    { icon: <AlertTriangle size={20} />, label: Tone.ANXIOUS, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
  ];
  const activeMood = moodOptions.find(m => m.label === mood) || moodOptions[0];

  // Group consecutive messages by role
  const groupedMessages: { messages: ChatMessage[]; role: string }[] = [];
  messages.forEach((msg) => {
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.role === msg.role) last.messages.push(msg);
    else groupedMessages.push({ messages: [msg], role: msg.role });
  });

  return (
    <>
      <AnimatedBackground />
      <div className="relative flex h-[calc(100vh-64px)] w-full gap-0 animate-in fade-in duration-700" style={{ zIndex: 1 }}>

        {/* Left Panel */}
        {isDesktop && showLeftPanel && (
          <LeftContextPanel
            conversations={conversations}
            activeConversationId={activeConversationId}
            isLoading={isHistoryLoading}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
            onTopicClick={handleTopicClick}
            onDelete={handleDeleteConversation}
          />
        )}

        {/* Center Chat Column */}
        <div className="flex-1 flex justify-center overflow-hidden relative">
          <div className="w-full max-w-[840px] flex flex-col px-4 md:px-8 h-full pb-6 pt-4">

            {/* Header */}
            <header className="flex items-center justify-between py-4 shrink-0">
              <div className="flex items-center gap-3">
                {isDesktop && (
                  <button
                    onClick={() => setShowLeftPanel(!showLeftPanel)}
                    className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]/80"
                  >
                    <ChevronLeft size={18} />
                  </button>
                )}
                <div className={`w-10 h-10 ${activeMood.bg} rounded-[1.25rem] flex items-center justify-center ${activeMood.color} border ${activeMood.border} shadow-sm transition-all`}>
                  {activeMood.icon}
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-[#052e16] leading-tight">Chat with Imam</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#052e16]/50">Spiritual Guide Active</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile: new chat button */}
                {!isDesktop && (
                  <button
                    onClick={handleNewChat}
                    className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                  >
                    <Plus size={18} />
                  </button>
                )}
                {isLargeDesktop && (
                  <button
                    onClick={() => setShowRightPanel(!showRightPanel)}
                    className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                  >
                    <ChevronRight size={18} />
                  </button>
                )}
                {/* Mobile/tablet: preferences modal trigger */}
                {!isLargeDesktop && (
                  <button
                    onClick={() => setShowPreferences(true)}
                    className="p-2.5 px-4 bg-white/60 backdrop-blur-md hover:bg-emerald-50/50 rounded-full transition-all text-[#052e16] shadow-sm border border-emerald-100/50 flex items-center gap-2"
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">{madhab}</span>
                    <SlidersHorizontal size={13} />
                  </button>
                )}
              </div>
            </header>

            {/* Chat Container - Locked height, no outer scroll */}
            <div className="flex-1 max-h-[700px] bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.03),0_0_30px_rgba(255,255,255,0.6)_inset] overflow-hidden flex flex-col mb-2 relative group transition-all duration-500 hover:shadow-[0_15px_50px_-10px_rgba(5,46,22,0.06),0_0_30px_rgba(255,255,255,0.6)_inset]">
              {/* Sacred Geometric Background Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l15 30-15 30-15-30z' fill='%23052e16' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                  backgroundSize: '30px 30px'
                }}
              />
              {/* Inner ambient glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/40 pointer-events-none" />

              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 no-scrollbar scroll-smooth relative z-10 flex flex-col">

                {messages.length === 0 && !isLoading && (
                  <EmptyState onPrompt={(q) => setInput(q)} />
                )}

                {groupedMessages.map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    className={`flex ${group.role === 'user' ? 'justify-end' : 'justify-start'} ${groupIdx > 0 ? 'mt-5' : ''}`}
                  >
                    <div className="space-y-2 max-w-[88%]">
                      {group.messages.map((msg, msgIdx) => (
                        <div
                          key={msg.id}
                          className={`animate-in fade-in slide-in-from-bottom-3 duration-300 ${msg.role === 'user'
                            ? 'p-4 md:p-5 rounded-[1.75rem] rounded-tr-sm bg-gradient-to-br from-[#052e16] to-[#064e3b] text-white shadow-lg shadow-[#052e16]/20'
                            : 'p-5 md:p-7 rounded-[1.75rem] rounded-tl-sm bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-100/80 shadow-md hover:shadow-lg hover:scale-[1.001] transition-all duration-200'
                            } `}
                          style={{ animationDelay: `${msgIdx * 30}ms` }}
                        >
                          {msg.role === 'model'
                            ? <FormattedContent content={msg.text} />
                            : <p className="text-[15px] leading-relaxed font-medium">{msg.text}</p>
                          }
                          <div className={`mt-1 text-[10px] md:text-[11px] font-medium tracking-wide ${msg.role === 'user' ? 'text-white/70 text-right' : 'text-slate-400/90'} `}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {isLoading && <TypingIndicator />}
              </div>

              {/* Input Area */}
              <div className="p-4 md:p-6 bg-white/60 backdrop-blur-md border-t border-slate-100/60 shrink-0">
                <div className="flex items-center gap-3 bg-white p-2.5 rounded-full border border-slate-200 shadow-md focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-400/20 transition-all max-w-3xl mx-auto">
                  <input
                    type="text"
                    placeholder="Seek guidance or ask a question…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm px-4 font-medium text-slate-700"
                  />
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 flex items-center justify-center bg-[#052e16] text-white rounded-full hover:scale-105 disabled:opacity-20 transition-all shadow-lg active:scale-95"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-[8px] text-center mt-2 font-black uppercase tracking-[0.2em] text-slate-400/60">Seek knowledge with humility</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel — Guidance Control (large desktop only) */}
        {isLargeDesktop && showRightPanel && (
          <GuidanceControlPanel
            madhab={madhab}
            setMadhab={setMadhab}
            tone={mood}
            setTone={setMood}
          />
        )}

        {/* Preferences Modal (mobile/tablet) */}
        {showPreferences && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#052e16]/30 backdrop-blur-md" onClick={() => setShowPreferences(false)} />
            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl border border-emerald-100 p-7 md:p-9 space-y-7 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#052e16]">Session Settings</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Customize your experience</p>
                </div>
                <button onClick={() => setShowPreferences(false)} className="p-2 hover:bg-emerald-50 rounded-full text-slate-300 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Current Mood</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {moodOptions.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMood(m.label)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all border ${mood === m.label ? 'bg-[#052e16] text-white border-[#052e16] shadow-lg' : 'bg-slate-50 border-emerald-50 text-slate-400 hover:border-emerald-100'} `}
                    >
                      <div className={mood === m.label ? 'text-white' : m.color}>{m.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">School of Thought (Madhhab)</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.values(Madhab).map(m => (
                    <button
                      key={m}
                      onClick={() => setMadhab(m)}
                      className={`py-3.5 rounded-xl text-[10px] font-bold border transition-all ${madhab === m ? 'bg-emerald-50 border-[#052e16] text-[#052e16]' : 'bg-slate-50 border-emerald-50 text-slate-500'} `}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={() => setShowPreferences(false)} className="w-full py-4.5 bg-[#052e16] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                Apply Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CoreChat;
