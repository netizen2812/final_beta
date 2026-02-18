import React from 'react';
import { BookOpen, MessageCircle, Heart, Plus, Trash2, MessageSquare } from 'lucide-react';
import { Conversation } from '../types';

interface LeftContextPanelProps {
    conversations: Conversation[];
    activeConversationId: string | null;
    isLoading: boolean;
    onSelect: (id: string) => void;
    onNewChat: () => void;
    onTopicClick?: (topic: string) => void;
    onDelete: (id: string) => void;
}

const islamicTopics = [
    { icon: <BookOpen size={16} />, label: 'Prayer Guidance', query: 'How should I perform my daily prayers?' },
    { icon: <Heart size={16} />, label: 'Daily Duas', query: 'What are essential daily duas I should know?' },
    { icon: <MessageCircle size={16} />, label: 'Fiqh Question', query: 'I have a question about Islamic jurisprudence.' },
];

const LeftContextPanel: React.FC<LeftContextPanelProps> = ({
    conversations,
    activeConversationId,
    isLoading,
    onSelect,
    onNewChat,
    onTopicClick,
    onDelete,
}) => {
    return (
        <div className="w-[260px] flex flex-col h-full overflow-hidden bg-white/70 backdrop-blur-md border-r border-slate-100/80">
            {/* New Chat Button */}
            <div className="p-4 border-b border-slate-100/80">
                <button
                    onClick={onNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#052e16] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-900 active:scale-95 transition-all shadow-md shadow-[#052e16]/20"
                >
                    <Plus size={16} />
                    New Chat
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-5 no-scrollbar">
                {/* Quick Topics */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-2">Quick Topics</p>
                    <div className="space-y-1">
                        {islamicTopics.map((topic, idx) => (
                            <button
                                key={idx}
                                onClick={() => onTopicClick?.(topic.query)}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-[#052e16] hover:bg-emerald-50/80 transition-all text-left group"
                            >
                                <span className="text-slate-300 group-hover:text-emerald-600 transition-colors">{topic.icon}</span>
                                <span className="text-xs font-semibold truncate">{topic.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conversation History */}
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-2">Recent</p>
                    {isLoading ? (
                        <div className="space-y-2 px-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-9 bg-slate-100 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : conversations.length === 0 ? (
                        <p className="text-[10px] text-slate-400 px-3 py-2 italic">No conversations yet</p>
                    ) : (
                        <div className="space-y-1">
                            {conversations.map((conv) => (
                                <div
                                    key={conv._id}
                                    className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${activeConversationId === conv._id
                                            ? 'bg-[#052e16] text-white shadow-md'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-[#052e16]'
                                        }`}
                                    onClick={() => onSelect(conv._id)}
                                >
                                    <MessageSquare size={13} className={`flex-shrink-0 ${activeConversationId === conv._id ? 'text-emerald-400' : 'text-slate-300 group-hover:text-emerald-600'}`} />
                                    <span className="text-xs font-medium truncate flex-1">{conv.title}</span>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(conv._id); }}
                                        className={`opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all hover:text-red-400 ${activeConversationId === conv._id ? 'text-white/60' : 'text-slate-300'}`}
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeftContextPanel;
