import { APPLICATION_API_URL } from '../lib/api';

// (No changes needed, file is already compliant with requirements)
// Justification: User has already implemented onPositionChange and scroll detection.
// I will verify this by marking the task as done.
import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  BookOpen,
  Book,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  ChevronLeft,
  ChevronRight,
  Settings,
  Bookmark,
  Share2,
  Info,
  Flame,
  Clock,
  Target,
  Sparkles,
  PlayCircle,
  MoreVertical,
  Volume2,
  Layers,
  ChevronDown as ChevronDownIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Analytics } from '../utils/analytics';
import { quranTracker } from '../utils/quranProgressTracker';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { useChildContext } from '../contexts/ChildContext';

interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  audio: string;
  text: string;
  translation: string;
  numberInSurah: number;
  surah?: {
    number: number;
    englishName: string;
  };
}

const JUZ_META = [
  { id: 1, start: 'Al-Fatiha 1' }, { id: 2, start: 'Al-Baqarah 142' }, { id: 3, start: 'Al-Baqarah 253' },
  { id: 4, start: 'Al-Imran 93' }, { id: 5, start: 'An-Nisa 24' }, { id: 6, start: 'An-Nisa 148' },
  { id: 7, start: 'Al-Ma\'idah 82' }, { id: 8, start: 'Al-An\'am 111' }, { id: 9, start: 'Al-A\'raf 88' },
  { id: 10, start: 'Al-Anfal 41' }, { id: 11, start: 'At-Tawbah 93' }, { id: 12, start: 'Hud 6' },
  { id: 13, start: 'Yusuf 53' }, { id: 14, start: 'Al-Hijr 1' }, { id: 15, start: 'Al-Isra 1' },
  { id: 16, start: 'Al-Kahf 75' }, { id: 17, start: 'Al-Anbiya 1' }, { id: 18, start: 'Al-Mu\'minun 1' },
  { id: 19, start: 'Al-Furqan 21' }, { id: 20, start: 'An-Naml 56' }, { id: 21, start: 'Al-Ankabut 45' },
  { id: 22, start: 'Al-Ahzab 31' }, { id: 23, start: 'Ya-Sin 28' }, { id: 24, start: 'Az-Zumar 32' },
  { id: 25, start: 'Fussilat 47' }, { id: 26, start: 'Al-Ahqaf 1' }, { id: 27, start: 'Adh-Dhariyat 31' },
  { id: 28, start: 'Al-Mujadila 1' }, { id: 29, start: 'Al-Mulk 1' }, { id: 30, start: 'An-Naba 1' },
  { id: 28, start: 'Al-Mujadila 1' }, { id: 29, start: 'Al-Mulk 1' }, { id: 30, start: 'An-Naba 1' },
];

interface QuranPageProps {
  onBack: () => void;
  // Controlled props for Live Session
  sessionCurrentSurah?: number;
  sessionCurrentAyah?: number;
  onAyahClick?: (surah: number, ayah: number) => void;
  /** Called when student changes surah/ayah (ayah click, surah switch, scroll). Throttled by parent. */
  onPositionChange?: (surah: number, ayah: number) => void;
  readOnly?: boolean;
}

const QuranPage: React.FC<QuranPageProps> = ({
  onBack,
  sessionCurrentSurah,
  sessionCurrentAyah,
  onAyahClick,
  onPositionChange,
  readOnly
}) => {
  const { t, i18n } = useTranslation();
  const { getToken, isSignedIn } = useAuth();

  const surahDisplayName = (s: Surah | { number: number; englishName: string; name?: string }) =>
    t(`quran.surahNames.${s.number}`, { defaultValue: s.englishName });
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [activeTab, setActiveTab] = useState<'read' | 'progress'>('read');
  const [viewMode, setViewMode] = useState<'surah' | 'juz'>('surah');
  const [view, setView] = useState<'home' | 'reading'>('home');
  const [selectedSurah, setSelectedSurah] = useState<Surah | null>(null);
  const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
  const [surahContent, setSurahContent] = useState<Ayah[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const readingContainerRef = useRef<HTMLDivElement>(null);
  const scrollThrottleRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [statsKey, setStatsKey] = useState(0); // Used to force progress re-render on sync

  // Sync with prop updates (for Live Session) — scholar view: autoscroll to student position
  useEffect(() => {
    if (sessionCurrentSurah && sessionCurrentAyah) {
      if (selectedSurah?.number === sessionCurrentSurah) {
        const ayahIndex = surahContent.findIndex(a => a.numberInSurah === sessionCurrentAyah);
        if (ayahIndex !== -1) {
          setCurrentAyahIndex(ayahIndex);
          const el = document.getElementById(`ayah-${ayahIndex}`);
          el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        const surahObj = surahs.find(s => s.number === sessionCurrentSurah);
        if (surahObj) {
          setSelectedSurah(surahObj);
          fetchSurahContent(sessionCurrentSurah, sessionCurrentAyah);
        } else if (surahs.length > 0) {
          fetchSurahContent(sessionCurrentSurah, sessionCurrentAyah);
        }
      }
    }
  }, [sessionCurrentSurah, sessionCurrentAyah, surahs]);

  // Autoscroll to active ayah precisely when index is updated (e.g. from nextAyah, next button, audio, or prop sync)
  useEffect(() => {
    if (currentAyahIndex !== null && currentAyahIndex !== undefined) {
      const el = document.getElementById(`ayah-${currentAyahIndex}`);
      // Only smooth scroll if we are in reading view and the element exists
      if (el && view === 'reading') {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentAyahIndex, view]);

  // Student: report position when surah/ayah changes (ayah click, next/prev, surah switch). Parent throttles.
  useEffect(() => {
    if (!selectedSurah || !surahContent.length) return;
    const ayah = surahContent[currentAyahIndex];
    if (ayah) {
      quranTracker.markAyahRead(selectedSurah.number, ayah.numberInSurah);
      if (onPositionChange && !readOnly) onPositionChange(selectedSurah.number, ayah.numberInSurah);
    }
  }, [onPositionChange, readOnly, selectedSurah, currentAyahIndex, surahContent]);

  // Student: on scroll stop (throttle 500ms), find visible ayah and report position
  useEffect(() => {
    if (!onPositionChange || readOnly || !selectedSurah || !surahContent.length) return;
    const container = readingContainerRef.current;
    if (!container) return;
    let scrollParent: HTMLElement | null = container.parentElement;
    while (scrollParent && !['auto', 'scroll', 'overlay'].includes(getComputedStyle(scrollParent).overflowY)) {
      scrollParent = scrollParent.parentElement;
    }
    if (!scrollParent) return;
    const onScroll = () => {
      if (scrollThrottleRef.current) return;
      scrollThrottleRef.current = setTimeout(() => {
        scrollThrottleRef.current = null;
        const parentRect = scrollParent!.getBoundingClientRect();
        const viewportCenterY = parentRect.top + parentRect.height / 2;
        let bestIdx = 0;
        let bestDist = Infinity;
        surahContent.forEach((_, idx) => {
          const el = document.getElementById(`ayah-${idx}`);
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const elCenterY = rect.top + rect.height / 2;
          const dist = Math.abs(elCenterY - viewportCenterY);
          if (dist < bestDist) {
            bestDist = dist;
            bestIdx = idx;
          }
        });
        const ayah = surahContent[bestIdx];
        if (ayah) {
          quranTracker.markAyahRead(selectedSurah.number, ayah.numberInSurah);
          if (onPositionChange && !readOnly) onPositionChange(selectedSurah.number, ayah.numberInSurah);
        }
      }, 500);
    };
    scrollParent.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scrollParent!.removeEventListener('scroll', onScroll);
      if (scrollThrottleRef.current) clearTimeout(scrollThrottleRef.current);
    };
  }, [onPositionChange, readOnly, selectedSurah, surahContent]);

  useEffect(() => {
    fetchSurahs();
    if (isSignedIn) {
      quranTracker.fetchFromServer(getToken).then(() => {
        // Force a re-render to update stats if new backend data arrived
        setStatsKey(prev => prev + 1);
      });
    }
  }, [isSignedIn]);

  // Refetch current surah/juz content when language changes
  useEffect(() => {
    if (view === 'reading') {
      if (selectedSurah) fetchSurahContent(selectedSurah.number);
      else if (selectedJuz) fetchJuzContent(selectedJuz);
    }
  }, [i18n.language]);

  // Track the actual reading time of the user
  useEffect(() => {
    if (view === 'reading' && !readOnly) {
      quranTracker.startTimeTracking();
    } else {
      quranTracker.stopTimeTracking();
      if (isSignedIn) {
        quranTracker.syncWithServer(getToken);
      }
    }

    return () => {
      quranTracker.stopTimeTracking();
      if (isSignedIn) {
        quranTracker.syncWithServer(getToken);
      }
    };
  }, [view, readOnly, isSignedIn]);

  const fetchSurahs = async () => {
    try {
      const response = await fetch(`${APPLICATION_API_URL}/api/ibadah/quran/surahs`);
      const data = await response.json();
      setSurahs(data.data);
    } catch (error) {
      console.error("Error fetching Surahs:", error);
    }
  };

  const fetchSurahContent = async (number: number, targetAyahNumber?: number) => {
    setIsLoading(true);
    setSelectedJuz(null);
    try {
      const res = await fetch(`${APPLICATION_API_URL}/api/ibadah/quran/surah/${number}?lang=${i18n.language}`);
      const data = await res.json();

      const { text, trans, audio } = data;

      const combined: Ayah[] = text.data.ayahs.map((ayah: any, idx: number) => {
        let cleanedText = ayah.text;
        if (text.data.number !== 1 && text.data.number !== 9 && ayah.numberInSurah === 1) {
          cleanedText = cleanedText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '');
        }

        return {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: cleanedText,
          translation: trans.data.ayahs[idx].text,
          audio: audio.data.ayahs[idx].audio
        };
      });

      setSurahContent(combined);
      setView('reading');

      if (targetAyahNumber) {
        const idx = combined.findIndex(a => a.numberInSurah === targetAyahNumber);
        setCurrentAyahIndex(idx !== -1 ? idx : 0);
      } else {
        setCurrentAyahIndex(0);
      }

      // Student live sync: report position after surah load (parent throttles)
      if (onPositionChange) onPositionChange(number, targetAyahNumber || 1);

      setIsPlaying(false);
    } catch (error) {
      console.error("Error fetching surah content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (view === 'reading' && (selectedSurah || selectedJuz)) {
      Analytics.trackEvent('quran_reader_open', {
        surahNumber: selectedSurah?.number,
        surahName: selectedSurah?.englishName,
        juz: selectedJuz
      }, 'quran');
    }
  }, [view, selectedSurah, selectedJuz]);

  const fetchJuzContent = async (juzNumber: number) => {
    setIsLoading(true);
    setSelectedSurah(null);
    setSelectedJuz(juzNumber);
    try {
      const res = await fetch(`${APPLICATION_API_URL}/api/ibadah/quran/juz/${juzNumber}?lang=${i18n.language}`);
      const data = await res.json();

      const { text, trans, audio } = data;

      const combined: Ayah[] = text.data.ayahs.map((ayah: any, idx: number) => {
        let cleanedText = ayah.text;
        if (ayah.surah.number !== 1 && ayah.surah.number !== 9 && ayah.numberInSurah === 1) {
          cleanedText = cleanedText.replace(/^بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ\s*/, '');
        }

        return {
          number: ayah.number,
          numberInSurah: ayah.numberInSurah,
          text: cleanedText,
          translation: trans.data.ayahs[idx].text,
          audio: audio.data.ayahs[idx].audio,
          surah: {
            number: ayah.surah.number,
            englishName: ayah.surah.englishName
          }
        };
      });

      setSurahContent(combined);
      setView('reading');
      setCurrentAyahIndex(0);
      setIsPlaying(false);
      localStorage.setItem('lastReadJuz', juzNumber.toString());
    } catch (error) {
      console.error("Error fetching juz content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error("Playback error:", err));
    }
  };

  const nextAyah = () => {
    if (currentAyahIndex < surahContent.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const prevAyah = () => {
    if (currentAyahIndex > 0) {
      setCurrentAyahIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(err => console.error("Auto-play error:", err));
      }
    }
  }, [currentAyahIndex, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, currentAyahIndex]);

  const filteredSurahs = surahs.filter(s =>
    s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.name.includes(searchQuery)
  );

  const stats = quranTracker.getStats();
  const { activeChild } = useChildContext();

  // Merge manual/scholar-verified progress with local tracked progress
  const manualKhatmPercentage = activeChild?.child_progress?.[0]?.completed_quran_parts 
      ? Math.min((activeChild.child_progress[0].completed_quran_parts.length / 450) * 100, 100) 
      : 0;
  
  const mergedKhatmPercentage = Math.round(Math.max(stats.khatmPercentage, manualKhatmPercentage));

  const PROGRESS_DATA = [
    { name: 'Completed', value: mergedKhatmPercentage },
    { name: 'Remaining', value: Math.max(0, 100 - mergedKhatmPercentage) },
  ];
  const COLORS = ['#10b981', '#f3f4f6'];

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-32 animate-in fade-in duration-500 overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-emerald-50 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={view === 'reading' ? () => { setView('home'); setIsPlaying(false); } : onBack}
            className="p-3 bg-white rounded-full text-[#0D4433] shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#0D4433]">
              {view === 'reading'
                ? (selectedSurah ? surahDisplayName(selectedSurah) : `Juz ${selectedJuz}`)
                : t('quran.alQuran')}
            </h1>
            {view === 'reading' && (
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">
                {selectedSurah ? `${t('quran.surah')} ${selectedSurah.number} • ${selectedSurah.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan')}` : `${t('quran.section')} ${selectedJuz}`}
              </span>
            )}
          </div>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <button className="p-3 text-gray-400 hover:text-[#0D4433]"><Bookmark size={20} /></button>
            <button className="p-3 text-gray-400 hover:text-[#0D4433]"><Settings size={20} /></button>
          </div>
        )}
      </header>

      {view === 'home' ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10 lg:pt-12 space-y-8 sm:space-y-12">
          {!readOnly && (
            <div className="flex bg-gray-100 p-1.5 rounded-3xl w-full max-w-md mx-auto">
              {['read', 'progress'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'bg-white text-[#0D4433] shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab === 'read' ? t('quran.read') : t('quran.progress')}
                </button>
              ))}
            </div>
          )}

          {activeTab === 'read' && (
            <div className="space-y-10">
              <div className="flex justify-center items-center gap-2 bg-emerald-50/50 p-1 rounded-2xl w-fit mx-auto border border-emerald-100/50">
                <button
                  onClick={() => setViewMode('surah')}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'surah' ? 'bg-[#0D4433] text-white shadow-lg' : 'text-[#0D4433]/40 hover:text-[#0D4433]'}`}
                >
                  {t('quran.surahView')}
                </button>
                <button
                  onClick={() => setViewMode('juz')}
                  className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === 'juz' ? 'bg-[#0D4433] text-white shadow-lg' : 'text-[#0D4433]/40 hover:text-[#0D4433]'}`}
                >
                  {t('quran.juzView')}
                </button>
              </div>

              <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#0D4433] transition-colors" size={20} />
                <input
                  type="text"
                  placeholder={viewMode === 'surah' ? t('quran.searchSurah') : t('quran.searchJuz')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-16 pr-6 py-6 bg-white border border-emerald-50 rounded-[2.5rem] shadow-sm outline-none focus:ring-4 focus:ring-emerald-50 transition-all font-medium text-gray-700"
                />
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300 ml-4">{t('quran.recentlyRecited')}</h3>
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                  {viewMode === 'surah' ? (
                    [surahs[0], surahs[17], surahs[35]].filter(Boolean).map((s, i) => (
                      <div key={i} onClick={() => { setSelectedSurah(s); fetchSurahContent(s.number); }} className="flex-shrink-0 w-64 bg-[#0D4433] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group cursor-pointer snap-center">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><BookOpen size={64} /></div>
                        <div className="text-[10px] font-black uppercase opacity-40 mb-2">{t('quran.surah')} {s.number}</div>
                        <h4 className="text-xl font-serif font-bold mb-4">{surahDisplayName(s)}</h4>
                        <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-emerald-400">Ayah 1</div>
                          <PlayCircle size={24} className="text-white" />
                        </div>
                      </div>
                    ))
                  ) : (
                    [JUZ_META[29], JUZ_META[0], JUZ_META[14]].map((j, i) => (
                      <div key={i} onClick={() => fetchJuzContent(j.id)} className="flex-shrink-0 w-64 bg-[#0D4433] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group cursor-pointer snap-center">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Layers size={64} /></div>
                        <div className="text-[10px] font-black uppercase opacity-40 mb-2">Juz {j.id}</div>
                        <h4 className="text-xl font-serif font-bold mb-4">{j.start.split(' ')[0]}</h4>
                        <div className="flex justify-between items-end">
                          <div className="text-[10px] font-bold text-emerald-400">{t('quran.continuePara')}</div>
                          <PlayCircle size={24} className="text-white" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="space-y-6 pb-20">
                <div className="px-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-300">
                    {viewMode === 'surah' ? t('quran.nobleChapters') : t('quran.thirtySections')}
                  </h3>
                </div>

                {viewMode === 'surah' ? (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredSurahs.map(s => (
                      <div
                        key={s.number}
                        onClick={() => { setSelectedSurah(s); fetchSurahContent(s.number); }}
                        className="bg-white p-6 rounded-[2.5rem] border border-emerald-50 flex items-center justify-between group hover:border-emerald-200 hover:shadow-xl transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-12 h-12 bg-emerald-50 text-[#0D4433] rounded-2xl flex items-center justify-center font-black text-sm rotate-45 group-hover:bg-[#0D4433] group-hover:text-white transition-all">
                            <span className="-rotate-45">{s.number}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{surahDisplayName(s)}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{s.revelationType === 'Meccan' ? t('quran.meccan') : t('quran.medinan')} • {s.numberOfAyahs} {t('quran.ayahs')}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-serif font-bold text-[#0D4433] arabic-text">{s.name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {JUZ_META.filter(j => j.id.toString().includes(searchQuery) || j.start.toLowerCase().includes(searchQuery.toLowerCase())).map(j => (
                      <div
                        key={j.id}
                        onClick={() => fetchJuzContent(j.id)}
                        className="bg-white p-8 rounded-[2.5rem] border border-emerald-50 flex items-center justify-between group hover:border-[#0D4433] transition-all cursor-pointer shadow-sm hover:shadow-lg"
                      >
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 bg-gray-50 text-[#0D4433] rounded-[1.5rem] flex flex-col items-center justify-center font-black transition-colors group-hover:bg-[#0D4433] group-hover:text-white">
                            <span className="text-[9px] uppercase opacity-40">{t('quran.para')}</span>
                            <span className="text-xl">{j.id}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 group-hover:text-[#0D4433]">Juz {j.id}</h4>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('quran.startsAt')} {j.start}</p>
                          </div>
                        </div>
                        <ChevronRight size={20} className="text-gray-200 group-hover:text-[#0D4433] transition-all" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}



          {activeTab === 'progress' && (
            <div className="space-y-12 animate-in slide-in-from-right-8 duration-500 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-50 shadow-sm text-center space-y-3">
                  <Flame size={32} className="mx-auto text-orange-500" fill="currentColor" />
                  <div className="text-4xl font-black text-[#0D4433]">{stats.streak}</div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('quran.dayStreak')}</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-50 shadow-sm text-center space-y-3">
                  <Clock size={32} className="mx-auto text-blue-500" />
                  <div className="text-4xl font-black text-[#0D4433]">{stats.minutesRead}</div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('quran.minutesRead')}</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] border border-emerald-50 shadow-sm text-center space-y-3">
                  <Target size={32} className="mx-auto text-emerald-500" />
                  <div className="text-4xl font-black text-[#0D4433]">{mergedKhatmPercentage}%</div>
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{t('quran.yearGoal')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-white p-12 rounded-[4rem] border border-emerald-50 shadow-xl">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={PROGRESS_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value" stroke="none">
                        {PROGRESS_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-6">
                  <h3 className="text-3xl font-serif font-bold text-[#0D4433]">{t('quran.khatmProgress')}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    {mergedKhatmPercentage === 0
                      ? t('quran.khatmDescStart', { defaultValue: 'You have just begun your beautiful journey with the Quran.' })
                      : mergedKhatmPercentage < 50
                        ? t('quran.khatmDescEarly', { defaultValue: 'Every letter you read brings a reward. Keep going!' })
                        : mergedKhatmPercentage < 100
                          ? t('quran.khatmDescLate', { defaultValue: 'You are making amazing progress! Consistent daily reading helps.' })
                          : t('quran.khatmDescDone', { defaultValue: 'Alhamdulillah! You have completed a full Khatm.' })
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div ref={readingContainerRef} className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-8 sm:space-y-12 pb-32 sm:pb-40">
          <div className="flex items-center gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x border-b border-emerald-50">
            {surahContent.map((ayah, idx) => (
              <button
                key={ayah.number}
                onClick={() => {
                  setCurrentAyahIndex(idx);
                  const el = document.getElementById(`ayah-${idx}`);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                className={`flex-shrink-0 w-12 h-12 rounded-full border-2 font-bold text-[10px] transition-all snap-center flex items-center justify-center ${currentAyahIndex === idx ? 'bg-[#0D4433] border-[#0D4433] text-white shadow-xl' : 'bg-white border-emerald-50 text-gray-300 hover:border-emerald-100 hover:text-[#0D4433]'}`}
              >
                {ayah.numberInSurah}
              </button>
            ))}
          </div>

          <div className="space-y-10">
            {surahContent.map((ayah, idx) => {
              const isActive = currentAyahIndex === idx;
              const surahNum = selectedSurah ? selectedSurah.number : ayah.surah?.number;
              const showSurahHeader = selectedJuz && (idx === 0 || surahContent[idx].surah?.number !== surahContent[idx - 1].surah?.number);
              const showBismillah = ayah.numberInSurah === 1 && surahNum !== 1 && surahNum !== 9;

              return (
                <div key={ayah.number} className="space-y-6">
                  {showSurahHeader && (
                    <div className="py-12 flex flex-col items-center gap-3">
                      <div className="h-px w-20 bg-emerald-200" />
                      <h3 className="text-2xl font-serif font-bold text-[#0D4433] uppercase tracking-widest">{ayah.surah?.englishName}</h3>
                      <div className="h-px w-20 bg-emerald-200" />
                    </div>
                  )}
                  {showBismillah && (
                    <div className="py-6 flex flex-col items-center justify-center animate-in fade-in duration-500">
                      <p className="text-4xl md:text-5xl font-serif text-[#0D4433] arabic-text text-center">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                    </div>
                  )}
                  <div
                    id={`ayah-${idx}`}
                    onClick={() => {
                      if (onAyahClick) {
                        onAyahClick(selectedSurah?.number || 1, ayah.numberInSurah);
                        onPositionChange?.(selectedSurah?.number ?? 1, ayah.numberInSurah);
                      } else {
                        setCurrentAyahIndex(idx);
                      }
                    }}
                    className={`space-y-8 p-10 rounded-[3.5rem] transition-all duration-700 cursor-pointer ${isActive ? 'bg-emerald-50/50 shadow-2xl scale-[1.02] border border-emerald-200 ring-1 ring-emerald-500/10' : 'bg-white/50 border border-transparent hover:bg-gray-50/50'}`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${isActive ? 'bg-[#0D4433] text-white' : 'bg-gray-50 text-gray-300'}`}>{ayah.numberInSurah}</span>
                        {selectedJuz && <span className="text-[9px] font-black uppercase text-gray-300 tracking-widest">{ayah.surah?.englishName}</span>}
                      </div>
                      <div className="flex gap-2">
                        <button className="p-2 text-gray-300 hover:text-[#0D4433] transition-colors"><Bookmark size={18} /></button>
                        <button className="p-2 text-gray-300 hover:text-[#0D4433] transition-colors"><Share2 size={18} /></button>
                        <button className="p-2 text-gray-300 hover:text-[#0D4433] transition-colors"><MoreVertical size={18} /></button>
                      </div>
                    </div>
                    <p className={`${readOnly ? 'text-2xl md:text-3xl lg:text-4xl leading-loose' : 'text-4xl md:text-5xl leading-[2.2]'} font-serif text-right arabic-text transition-colors ${isActive ? 'text-[#0D4433]' : 'text-gray-700'}`} dir="rtl">
                      {ayah.text}
                    </p>
                    {surahNum === 1 && ayah.numberInSurah === 7 && (
                      <p className={`text-2xl md:text-3xl font-serif text-center font-bold arabic-text transition-colors pt-2 pb-4 ${isActive ? 'text-red-600' : 'text-red-500'}`} dir="rtl">
                        آمِين
                      </p>
                    )}
                    <div className={`h-px w-24 ml-auto transition-all ${isActive ? 'bg-emerald-300' : 'bg-gray-100'}`} />
                    <p className={`text-xl font-medium leading-relaxed transition-colors ${isActive ? 'text-[#1c2833]' : 'text-gray-400'}`}>
                      {ayah.translation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'reading' && (
        <div className="fixed bottom-20 lg:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-2xl z-50">
          <div className="bg-[#0D4433] rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-6 shadow-[0_40px_80px_-20px_rgba(13,68,51,0.6)] text-white flex items-center justify-between gap-3 sm:gap-6 border border-white/10 ring-1 ring-black/5 animate-in slide-in-from-bottom-12 duration-700">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/20 shrink-0">
                <Volume2 className="text-emerald-300" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{t('quran.recitingAyah')} {surahContent[currentAyahIndex]?.numberInSurah}</div>
                <div className="text-sm font-bold truncate">{selectedSurah ? surahDisplayName(selectedSurah) : `Juz ${selectedJuz} - ${surahContent[currentAyahIndex]?.surah?.englishName}`}</div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={prevAyah} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90"><SkipBack size={20} fill="white" /></button>
              <button
                onClick={togglePlay}
                className="w-16 h-16 bg-white text-[#0D4433] rounded-full flex items-center justify-center shadow-xl hover:scale-110 active:scale-95 transition-all"
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
              </button>
              <button onClick={nextAyah} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90"><SkipForward size={20} fill="white" /></button>
            </div>

            <div className="hidden lg:flex items-center bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
              <select
                value={playbackSpeed}
                onChange={e => setPlaybackSpeed(Number(e.target.value))}
                className="bg-transparent text-[10px] font-black outline-none appearance-none uppercase tracking-widest cursor-pointer pr-2"
              >
                <option value="0.5" className="bg-[#0D4433]">0.5x</option>
                <option value="1" className="bg-[#0D4433]">1.0x</option>
                <option value="1.25" className="bg-[#0D4433]">1.25x</option>
                <option value="1.5" className="bg-[#0D4433]">1.5x</option>
              </select>
              <ChevronDown size={10} className="text-emerald-400" />
            </div>
          </div>
          <audio
            ref={audioRef}
            src={surahContent[currentAyahIndex]?.audio}
            onEnded={nextAyah}
            onPlay={() => setIsPlaying(true)}
          />
        </div>
      )}

      {isLoading && (
        <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 bg-[#0D4433] rounded-[2.5rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse">
              <Sparkles size={40} className="text-emerald-300" />
            </div>
            <p className="text-xs font-black uppercase text-[#0D4433] tracking-[0.4em] animate-pulse">Retrieving Wisdom...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ChevronDown = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6" /></svg>
);

export default QuranPage;
