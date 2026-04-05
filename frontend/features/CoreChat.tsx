import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, ChevronDown, CloudRain, Sun, Smile,
  AlertTriangle, SlidersHorizontal, X, Sparkles,
  ChevronLeft, ChevronRight, Plus, History
} from 'lucide-react';
import { Madhab, ChatMessage, Tone, Conversation } from '../types';
import { getImamResponse } from '../geminiService';
import { useAuth } from "@clerk/clerk-react";
import LeftContextPanel from '../components/LeftContextPanel';
import GuidanceControlPanel from '../components/RightUtilityPanel';
import { Analytics } from '../utils/analytics';
import { useTranslation } from 'react-i18next';
import { ChatLimitModal } from './ChatLimitModal';

import { APPLICATION_API_URL } from '../lib/api';

// ─── Animated Background ────────────────────────────────────────────────────
const AnimatedBackground: React.FC = () => (
  <div
    className="fixed inset-0 pointer-events-none overflow-hidden h-screen w-screen"
    style={{ zIndex: 0, position: 'fixed' }}
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
    <div className="bg-white/80 backdrop-blur-sm px-5 py-3.5 rounded-2xl rounded-tl-none border border-slate-100 flex gap-2.5 items-center shadow-sm">
      <div className="flex gap-1.5 items-center">
        {[0, 150, 300].map((delay) => (
          <div key={delay} className="w-1.5 h-1.5 bg-[#052e16]/40 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-[#052e16]/40">Thinking</span>
    </div>
  </div>
);

// ─── Empty State ─────────────────────────────────────────────────────────────
const EmptyState: React.FC<{ onPrompt: (q: string) => void }> = ({ onPrompt }) => {
  const { t } = useTranslation();
  const prompts = [
    { emoji: '🤲', text: t('chat.promptPrayer') },
    { emoji: '📖', text: t('chat.promptFatiha') },
    { emoji: '💚', text: t('chat.promptPatience') },
    { emoji: '🌙', text: t('chat.promptRamadan') },
  ];
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-lg mx-auto text-center space-y-6 animate-in zoom-in-95 duration-700 min-h-0">
      <div className="relative shrink-0">
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-[2rem] flex items-center justify-center shadow-inner border border-emerald-100">
          <Sparkles size={36} className="text-[#052e16]/70" />
        </div>
        <div className="absolute -inset-3 rounded-[2.5rem] border border-emerald-100/60 animate-pulse" />
      </div>
      <div className="space-y-2 shrink-0">
        <h3 className="text-2xl font-serif font-bold text-[#052e16]">{t('chat.greeting')}</h3>
        <p className="text-sm leading-relaxed text-slate-500 max-w-[280px] mx-auto">
          {t('chat.greetingDesc')}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 w-full pb-2">
        {prompts.map((p, i) => (
          <button
            key={i}
            onClick={() => onPrompt(p.text)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-full hover:border-emerald-200 hover:bg-emerald-50/50 transition-all duration-200 group"
          >
            <span className="text-sm">{p.emoji}</span>
            <span className="text-[10px] font-bold text-slate-600 group-hover:text-[#052e16] whitespace-nowrap">{p.text}</span>
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
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showMobileHistory, setShowMobileHistory] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  useEffect(() => {
    if (showMobileHistory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showMobileHistory]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024 && !document.querySelector('.is-phone-app'));
  const [isLargeDesktop, setIsLargeDesktop] = useState(window.innerWidth >= 1440 && !document.querySelector('.is-phone-app'));

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const initialHeight = useRef(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const isInsidePhone = !!document.querySelector('.is-phone-app');
      const currentHeight = window.innerHeight;
      
      // If height drops more than 150px, keyboard is likely open
      setIsKeyboardOpen(initialHeight.current - currentHeight > 150);
      
      setIsDesktop(window.innerWidth >= 1024 && !isInsidePhone);
      setIsLargeDesktop(window.innerWidth >= 1440 && !isInsidePhone);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    Analytics.trackEvent('ai_imam_open', { conversationId: activeConversationId }, 'ai_imam');
  }, []); // Run once on mount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isLoading]);

  // ── Fetch conversation list ──────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${APPLICATION_API_URL}/api/conversations`, {
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
      const res = await fetch(`${APPLICATION_API_URL}/api/conversations`, {
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
      const res = await fetch(`${APPLICATION_API_URL}/api/conversations/${id}`, {
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
      await fetch(`${APPLICATION_API_URL}/api/conversations/${id}`, {
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
        const res = await fetch(`${APPLICATION_API_URL}/api/conversations`, {
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

      Analytics.trackEvent('ai_imam_message_sent', {
        conversationId: convId,
        length: input.length,
        message: input.substring(0, 50) // Capture snippet for context
      }, 'ai_imam');

      const aiResponse = await getImamResponse(input, madhab, mood, apiHistory, token, convId ?? undefined);

      const responseStr = typeof aiResponse === 'string' ? aiResponse : String(aiResponse);
      if (responseStr.includes("PAYWALL_TRIGGER") || responseStr.includes("PAYWALLTRIGGER")) {
         setMessages(prev => prev.filter(m => m.id !== userMessage.id)); // Remove the user message
         setShowLimitModal(true);
         setIsLoading(false);
         return;
      }

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
        text: t('chat.errorReflecting'),
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

  const isAppMode = !!document.querySelector('.is-phone-app');

  return (
    <>
      <AnimatedBackground />
      <div className="relative flex flex-1 w-full gap-0 animate-in fade-in duration-700 overflow-hidden" style={{ zIndex: 1, minHeight: 0 }}>

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
          <div className={`w-full ${isDesktop ? 'max-w-[840px] px-8 pt-4 pb-6' : 'max-w-full px-4 pt-4 pb-0'} flex flex-col h-full overscroll-none`}>

            {/* Header (Hidden in App Mode as App.tsx has its own) */}
            {!isAppMode && (
              <header className="flex items-center justify-between py-4 shrink-0 px-4">
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
                    <h2 className="text-lg font-serif font-bold text-[#052e16] leading-tight">{t('chat.title')}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-[#052e16]/50">{t('chat.statusActive')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isDesktop && (
                    <>
                      <button
                        onClick={() => setShowMobileHistory(true)}
                        className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                        title={t('chat.history')}
                      >
                        <History size={20} />
                      </button>
                      <button
                        onClick={() => setShowPreferences(true)}
                        className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                        title={t('chat.settings')}
                      >
                        <SlidersHorizontal size={20} />
                      </button>
                      <button
                        onClick={handleNewChat}
                        className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                        title={t('chat.newChat')}
                      >
                        <Plus size={22} />
                      </button>
                    </>
                  )}
                  {isLargeDesktop && (
                    <button
                      onClick={() => setShowRightPanel(!showRightPanel)}
                      className="p-2 hover:bg-white/60 rounded-xl transition-all text-slate-400 hover:text-[#052e16]"
                    >
                      <ChevronRight size={18} />
                    </button>
                  )}
                  {/* Tablet preference trigger */}
                  {!isLargeDesktop && isDesktop && (
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
            )}

            {/* Chat Container */}
            <div className={`flex-1 flex flex-col overflow-hidden relative transition-all duration-500 ${isDesktop 
              ? 'bg-white/40 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_8px_40px_-10px_rgba(0,0,0,0.03)] mb-2' 
              : 'bg-transparent'}`}>
              
              {/* Islamic Pattern Background */}
              <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l10 30 30 10-30 10-10 30-10-30-30-10 30-10z' fill='%23052e16'/%3E%3C/svg%3E")`,
                  backgroundSize: '40px 40px'
                }}
              />

              {/* Message List */}
              <div className={`flex-1 overflow-y-auto ${messages.length > 0 ? (isDesktop ? 'p-6 md:p-10' : 'p-4 pb-32') : 'p-4 pb-12'} space-y-6 no-scrollbar relative z-10 flex flex-col`}
                style={{ 
                  overscrollBehavior: 'none',
                  WebkitOverflowScrolling: 'touch'
                }}>
                {messages.length === 0 && !isLoading && (
                  <EmptyState onPrompt={(q) => setInput(q)} />
                )}

                {groupedMessages.map((group, groupIdx) => (
                  <div
                    key={groupIdx}
                    className={`flex ${group.role === 'user' ? 'justify-end' : 'justify-start'} ${groupIdx > 0 ? 'mt-5' : ''}`}
                  >
                    <div className={`space-y-3 ${isDesktop ? 'max-w-[85%]' : 'max-w-[92%]'}`}>
                      {group.messages.map((msg, msgIdx) => (
                        <div
                          key={msg.id}
                          className={`animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm ${msg.role === 'user'
                            ? 'p-4 md:p-5 rounded-2xl rounded-tr-sm bg-[#052e16] text-white/95'
                            : 'p-4 md:p-7 rounded-2xl rounded-tl-sm bg-white/95 backdrop-blur-sm text-slate-900 border border-slate-100'
                            } `}
                          style={{ animationDelay: `${msgIdx * 30}ms` }}
                        >
                          {msg.role === 'model'
                            ? <FormattedContent content={msg.text} />
                            : <p className="text-[16px] leading-relaxed font-medium">{msg.text}</p>
                          }
                          <div className={`mt-2 text-[10px] font-bold tracking-tight opacity-40 ${msg.role === 'user' ? 'text-right' : ''} `}>
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Sticky Input Area (Standard flex placement instead of fixed) */}
              <div className={`shrink-0 relative w-full bg-white/80 backdrop-blur-md border-t border-slate-100/60 z-20 ${isDesktop ? 'p-4 md:p-6' : 'p-3 pb-4'}`}>
                <div className={`flex items-center gap-2 bg-white ${isDesktop ? 'p-2' : 'p-1.5'} rounded-full border border-slate-200 shadow-sm focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-400/10 transition-all max-w-3xl mx-auto`}>
                  
                  {/* Settings Button (Mobile) */}
                  {!isDesktop && (
                    <button 
                      onClick={() => setShowPreferences(true)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-[#052e16] transition-colors"
                    >
                      <SlidersHorizontal size={20} />
                    </button>
                  )}

                  <input
                    type="text"
                    placeholder={t('chat.inputPlaceholder')}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-transparent border-none focus:outline-none text-[15px] md:text-[16px] px-2 md:px-3 font-medium text-slate-700 w-0 min-w-0"
                  />
                  
                  <button
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#052e16] text-white rounded-full hover:scale-105 disabled:opacity-20 transition-all shadow-md active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </div>
                {!isDesktop && (
                  <p className="text-[7px] text-center mt-2 font-black uppercase tracking-[0.2em] text-slate-400 opacity-60">
                    {t('chat.seekKnowledge')}
                  </p>
                )}
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

        {/* Mobile History Drawer */}
        {!isDesktop && showMobileHistory && (
          <div className="fixed inset-0 z-[250] flex justify-start">
            <div className="absolute inset-0 bg-[#052e16]/30 backdrop-blur-sm" onClick={() => setShowMobileHistory(false)} />
            <div className="relative w-[280px] h-full bg-white shadow-2xl animate-in slide-in-from-left duration-300">
              <LeftContextPanel
                conversations={conversations}
                activeConversationId={activeConversationId}
                isLoading={isHistoryLoading}
                onSelect={(id) => { handleSelectConversation(id); setShowMobileHistory(false); }}
                onNewChat={() => { handleNewChat(); setShowMobileHistory(false); }}
                onTopicClick={(q) => { handleTopicClick(q); setShowMobileHistory(false); }}
                onDelete={handleDeleteConversation}
                onClose={() => setShowMobileHistory(false)}
              />
            </div>
          </div>
        )}

        {/* Preferences Modal (mobile/tablet) */}
        {showPreferences && (
          <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#052e16]/30 backdrop-blur-md" onClick={() => setShowPreferences(false)} />
            <div className="relative w-full max-w-md bg-white rounded-t-[3rem] md:rounded-[2.5rem] shadow-2xl border border-emerald-100 p-7 md:p-9 pt-10 md:pt-9 space-y-7 animate-in slide-in-from-bottom duration-300">
              {/* Drag Handle for Mobile */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-100 rounded-full md:hidden" />
              
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#052e16]">{t('chat.sessionSettings')}</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{t('chat.customizeExperience')}</p>
                </div>
                <button onClick={() => setShowPreferences(false)} className="p-2 hover:bg-emerald-50 rounded-full text-slate-300 transition-colors">
                  <X size={22} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('chat.currentMood')}</label>
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
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('chat.schoolOfThought')}</label>
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
                {t('chat.applyChanges')}
              </button>
            </div>
          </div>
        )}
      </div>

      <ChatLimitModal 
         isOpen={showLimitModal} 
         onClose={() => setShowLimitModal(false)} 
         onSuccess={() => {
            alert("Payment successful! You now have unlimited messaging for 30 days. Please ask your question again.");
            setShowLimitModal(false);
         }} 
      />
    </>
  );
};

export default CoreChat;
