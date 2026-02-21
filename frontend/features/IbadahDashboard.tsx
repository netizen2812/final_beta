import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Compass,
  Calculator,
  MapPin,
  Calendar as CalendarIcon,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Navigation,
  Star,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Info,
  Camera,
  ThumbsUp,
  Sparkles,
  ChevronDown,
  ArrowLeft,
  Volume2,
  CheckCircle2,
  Share2,
  Bookmark,
  CalendarDays,
  Target,
  AlertCircle,
  Maximize,
  Heart,
  BookOpen,
  Mic,
  ArrowRight
} from 'lucide-react';
import QuranPage from './QuranPage';
import QiblaPage from './qibla/QiblaPage';
import { getPrayerTimings, getHijriDate, getCalendarMonth, formatDateForAPI, calculateQibla, getMagneticDeclination } from '../services/aladhan';

// --- TYPES & CONSTANTS ---

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

interface PrayerTime {
  name: PrayerName;
  time: string;
  id: number;
}
const normalizeAngle = (angle: number) => (angle + 360) % 360;

const GENERAL_DISCLAIMER = "For guidance and convenience only. Accuracy may vary. Consult local authorities for definitive religious rulings.";

type SubView = 'landing' | 'prayer-guide' | 'qibla' | 'dua' | 'calendar' | 'calendar-detail' | 'zakat-calc' | 'zakat-result' | 'quran';

// --- THEME LOGIC (HERO ONLY) ---

const getThemeForTime = (hour: number) => {
  if (hour >= 5 && hour < 7) return 'fajr';
  if (hour >= 7 && hour < 16) return 'dhuhr';
  if (hour >= 16 && hour < 18) return 'asr';
  if (hour >= 18 && hour < 19) return 'maghrib';
  return 'isha';
};

const HERO_THEMES = {
  fajr: {
    bg: 'bg-gradient-to-b from-[#1a1c2c] via-[#4a4e69] to-[#0D4433]',
    icon: <Sunrise className="w-16 h-16 text-pink-200 animate-pulse" />,
    label: 'Fajr — Dawn is Breaking'
  },
  dhuhr: {
    bg: 'bg-gradient-to-b from-[#023047] via-[#219ebc] to-[#0D4433]',
    icon: <Sun className="w-16 h-16 text-amber-100 animate-spin [animation-duration:20s]" />,
    label: 'Dhuhr — Under the Midday Sun'
  },
  asr: {
    bg: 'bg-gradient-to-b from-[#582f0e] via-[#7f4f24] to-[#0D4433]',
    icon: <Sun className="w-16 h-16 text-orange-200 opacity-80" />,
    label: 'Asr — Afternoon Glow'
  },
  maghrib: {
    bg: 'bg-gradient-to-b from-[#2d1b33] via-[#7c3a67] to-[#0D4433]',
    icon: <Sunset className="w-16 h-16 text-rose-200" />,
    label: 'Maghrib — Evening Prayer Awaits'
  },
  isha: {
    bg: 'bg-gradient-to-b from-[#0b0d17] via-[#1c2541] to-[#0D4433]',
    icon: <Moon className="w-16 h-16 text-blue-100 animate-pulse" />,
    label: 'Isha — Under the Night Sky'
  }
};

// --- TASBIH COMPONENT ---
const TasbihWidget = () => {
  const [count, setCount] = useState(0);
  const [goal, setGoal] = useState(33);

  const increment = () => {
    setCount(prev => (prev + 1));
    if (window.navigator.vibrate) window.navigator.vibrate(50);
  };

  const reset = () => setCount(0);

  return (
    <div className="bg-white rounded-[3rem] p-8 border border-emerald-100 shadow-xl flex flex-col items-center justify-center space-y-6 group hover:border-emerald-300 transition-all">
      <div className="flex justify-between w-full items-center mb-2">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tasbih Counter</span>
        <button onClick={reset} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-800">Reset</button>
      </div>
      <div
        onClick={increment}
        className="w-40 h-40 rounded-full bg-emerald-50 border-8 border-white shadow-inner flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-all group-hover:bg-emerald-100"
      >
        <span className="text-5xl font-black text-[#0D4433]">{count}</span>
        <span className="text-[10px] font-bold text-emerald-600/50 mt-1">TAP TO COUNT</span>
      </div>
      <div className="flex gap-2">
        {[33, 99, 100].map(g => (
          <button
            key={g}
            onClick={() => setGoal(g)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${goal === g ? 'bg-[#0D4433] text-white' : 'bg-gray-50 text-gray-400'}`}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-500"
          style={{ width: `${Math.min((count / goal) * 100, 100)}%` }}
        />
      </div>
    </div>
  );
};

// --- HADITH COMPONENT ---
const HadithWidget = () => {
  const [hadith, setHadith] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHadith = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/ibadah/hadith/daily`);
        const data = await res.json();
        setHadith(data);
      } catch (e) {
        console.error("Hadith fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHadith();
  }, []);

  if (loading) return <div className="bg-white rounded-[3rem] p-10 border border-emerald-50 shadow-sm animate-pulse h-48" />;

  return (
    <div className="bg-[#0D4433] rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Sparkles size={120} /></div>
      <div className="relative z-10 space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-300">
          Hadith of the Day
        </div>
        <p className="text-xl font-serif text-right leading-loose" dir="rtl">{hadith?.arab}</p>
        <p className="text-emerald-100/80 text-sm font-medium leading-relaxed italic border-l-2 border-emerald-500/30 pl-6">
          "{hadith?.id || hadith?.text}"
        </p>
        <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-40">Sahih Bukhari • Reference {hadith?.number}</div>
      </div>
    </div>
  );
};

// --- ZAKAT CALCULATOR (top-level to prevent remount on parent re-render) ---
const ZakatCalcPage = ({ onResult, onBack }: { onResult: (result: any) => void; onBack: () => void }) => {
  const [cash, setCash] = React.useState<string>('');
  const [gold, setGold] = React.useState<string>('');
  const [silver, setSilver] = React.useState<string>('');
  const [investments, setInvestments] = React.useState<string>('');
  const [liabilities, setLiabilities] = React.useState<string>('');
  const [loading, setLoading] = React.useState(false);
  const [marketPrices, setMarketPrices] = React.useState<any>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/ibadah/zakat/prices`);
        const data = await res.json();
        setMarketPrices(data);
      } catch (e) {
        console.warn("Metal prices fetch failed", e);
      }
    };
    fetchPrices();
  }, []);

  const handleReset = () => {
    setCash('');
    setGold('');
    setSilver('');
    setInvestments('');
    setLiabilities('');
  };

  const calculate = async () => {
    setLoading(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/zakat/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cash: parseFloat(cash) || 0,
          gold_grams: parseFloat(gold) || 0,
          silver_grams: parseFloat(silver) || 0,
          investments: parseFloat(investments) || 0,
          liabilities: parseFloat(liabilities) || 0,
          prices: marketPrices // Send live prices to backend if available
        })
      });
      const result = await response.json();
      setLoading(false);
      onResult(result);
    } catch (error) {
      console.error('Zakat Calculation Error', error);
      setLoading(false);
    }
  };

  const fields: { label: string; value: string; setter: (v: string) => void; placeholder: string }[] = [
    { label: 'Cash in Hand / Bank (₹)', value: cash, setter: setCash, placeholder: '₹ 0' },
    { label: 'Gold (Grams)', value: gold, setter: setGold, placeholder: 'Grams' },
    { label: 'Silver (Grams)', value: silver, setter: setSilver, placeholder: 'Grams' },
    { label: 'Investments / Shares (₹)', value: investments, setter: setInvestments, placeholder: '₹ 0' },
    { label: 'Liabilities / Debts (₹)', value: liabilities, setter: setLiabilities, placeholder: '₹ 0' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF8] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-xl mx-auto space-y-12">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-3 bg-white hover:bg-emerald-50 rounded-full transition-all text-[#0D4433] shadow-sm border border-emerald-100">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-3xl font-serif font-bold text-[#0D4433]">Zakat Calculator</h2>
          {marketPrices?.isLive && (
            <div className="ml-auto px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
              <Sparkles size={12} className="animate-pulse" /> Live Market Prices Active
            </div>
          )}
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-emerald-50 shadow-xl space-y-8">
          {fields.map(({ label, value, setter, placeholder }) => (
            <div key={label} className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-300 ml-4">{label}</label>
              <input
                type="number"
                value={value}
                onChange={e => setter(e.target.value)}
                className="w-full p-6 bg-gray-50 border-none rounded-2xl outline-none font-bold text-[#0D4433]"
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="flex gap-4">
            <button
              onClick={handleReset}
              className="flex-1 py-6 bg-gray-50 text-gray-400 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-gray-100 transition-all"
            >
              Reset
            </button>
            <button
              onClick={calculate}
              disabled={loading}
              className="flex-[2] py-6 bg-[#0D4433] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl hover:bg-emerald-900 transition-all disabled:opacity-60"
            >
              {loading ? 'Calculating...' : 'Calculate Zakat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const IbadahDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeHeroTheme, setActiveHeroTheme] = useState<keyof typeof HERO_THEMES>('dhuhr');
  const [subView, setSubView] = useState<SubView>('landing');
  const [selectedPrayer, setSelectedPrayer] = useState<PrayerTime | null>(null);
  const [zakatResult, setZakatResult] = useState<any>(null);

  // Hijri States
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedHijriContext, setSelectedHijriContext] = useState<any>(null);
  const [hijriInfo, setHijriInfo] = useState<any>(null);
  const [fullMonthCalendar, setFullMonthCalendar] = useState<any[]>([]);
  const [isCalendarLoading, setIsCalendarLoading] = useState(false);

  // --- BACKEND STATE ---
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<string>('');

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn('Geolocation blocked/failed', err)
      );
    }
  }, []);

  // ... (completedPrayers logic) ...
  const [completedPrayers, setCompletedPrayers] = useState<string[]>(() => {
    const saved = localStorage.getItem('imam_completed_prayers');
    const lastDate = localStorage.getItem('imam_last_prayer_date');
    const today = new Date().toDateString();
    if (lastDate !== today) return [];
    return saved ? JSON.parse(saved) : [];
  });

  const togglePrayerCompletion = (name: string) => {
    setCompletedPrayers(prev => {
      const next = prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name];
      localStorage.setItem('imam_completed_prayers', JSON.stringify(next));
      localStorage.setItem('imam_last_prayer_date', new Date().toDateString());
      return next;
    });
  };

  // QIBLA SENSOR LOGIC HAS BEEN MOVED TO QiblaPage component

  // DATA FETCHING
  useEffect(() => {
    if (!location) return;

    let isMounted = true;

    const fetchData = async () => {
      // Prayer Times
      const timingsData = await getPrayerTimings(location.lat, location.lng);
      if (isMounted && timingsData) {
        const mapped: PrayerTime[] = [
          { id: 1, name: 'Fajr', time: timingsData.timings.Fajr },
          { id: 2, name: 'Dhuhr', time: timingsData.timings.Dhuhr },
          { id: 3, name: 'Asr', time: timingsData.timings.Asr },
          { id: 4, name: 'Maghrib', time: timingsData.timings.Maghrib },
          { id: 5, name: 'Isha', time: timingsData.timings.Isha },
        ];
        setPrayerTimes(mapped);
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        let found = mapped.find(p => {
          const [h, m] = p.time.split(':').map(Number);
          return (h * 60 + m) > nowMinutes;
        });
        setNextPrayer(found ? found.name : 'Fajr');
      }

      const todayHijri = await getHijriDate();
      if (isMounted) {
        setHijriInfo(todayHijri);
        // Mandatory: Establish a single context starting with Today
        const todayStr = formatDateForAPI(new Date());
        setSelectedHijriContext({
          hijri: todayHijri,
          gregorian: { date: todayStr },
          isToday: true
        });
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, [location]);

  // MONTHLY CALENDAR FETCHING
  useEffect(() => {
    if (!location) return;

    const fetchMonth = async () => {
      setIsCalendarLoading(true);
      const m = viewDate.getMonth() + 1;
      const y = viewDate.getFullYear();
      const calendarMonthRaw = await getCalendarMonth(location.lat, location.lng, m, y);
      const todayStr = formatDateForAPI(new Date());

      const transformedCalendar = (calendarMonthRaw || []).map((day: any) => ({
        ...day,
        isToday: day.date?.gregorian?.date === todayStr
      }));
      setFullMonthCalendar(transformedCalendar);
      setIsCalendarLoading(false);
    };

    fetchMonth();
  }, [location, viewDate]);

  const changeMonth = (offset: number) => {
    const next = new Date(viewDate);
    next.setMonth(next.getMonth() + offset);
    setViewDate(next);
  };

  const theme = HERO_THEMES[activeHeroTheme];

  const navigateTo = async (view: SubView, data?: any) => {
    if (view === 'qibla') {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const response = await (DeviceOrientationEvent as any).requestPermission();
          if (response === 'granted') console.log('Compass permission granted');
        } catch (e) {
          console.warn('Compass permission rejected:', e);
        }
      }
    }

    if (view === 'prayer-guide') setSelectedPrayer(data);
    if (view === 'zakat-result') setZakatResult(data);
    if (view === 'calendar-detail') setSelectedHijriContext(data);
    setSubView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (subView === 'calendar-detail') setSubView('calendar');
    else setSubView('landing');
  };

  // --- SUB-VIEW COMPONENTS ---

  const SubHeader = ({ title, onBackOverride }: { title: string, onBackOverride?: () => void }) => (
    <div className="flex items-center gap-4 mb-10">
      <button onClick={onBackOverride || goBack} className="p-3 bg-white hover:bg-emerald-50 rounded-full transition-all text-[#0D4433] shadow-sm border border-emerald-100">
        <ArrowLeft size={20} />
      </button>
      <h2 className="text-3xl font-serif font-bold text-[#0D4433]">{title}</h2>
    </div>
  );

  const PrayerGuidePage = () => (
    <div className="min-h-screen bg-[#FDFCF8] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <SubHeader title={`${selectedPrayer?.name} Prayer Guide`} />
        <div className="space-y-8">
          <div className="bg-[#0D4433] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-5"><Sparkles size={120} /></div>
            <div className="relative z-10 grid grid-cols-2 gap-8 text-center">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Total Rakats</div>
                <div className="text-5xl font-black">{selectedPrayer?.name === 'Fajr' ? '2' : selectedPrayer?.name === 'Maghrib' ? '3' : '4'}</div>
              </div>
              <div className="border-l border-white/10">
                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Recitation</div>
                <div className="text-2xl font-bold">{selectedPrayer?.name === 'Asr' || selectedPrayer?.name === 'Dhuhr' ? 'Silent' : 'Loud (1st & 2nd)'}</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 ml-4">Steps of Worship</h3>
            {[
              { title: 'Niyyah', desc: 'Formulate the intention in your heart for the specific prayer.' },
              { title: 'Takbiratul Ihram', desc: 'Raise your hands to ears and say "Allahu Akbar" to begin.' },
              { title: 'Qiyam & Recitation', desc: 'Stand with hands folded. Recite Surah Al-Fatiha and another Surah.' },
              { title: 'Ruku', desc: 'Bow down, keeping back straight. Say "Subhana Rabbiyal Adheem" thrice.' },
              { title: 'Sujud', desc: 'Prostrate with forehead, nose, palms, knees, and toes touching ground.' }
            ].map((step, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm flex items-start gap-8 group hover:border-emerald-200 transition-all">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 font-black text-[#0D4433] group-hover:bg-[#0D4433] group-hover:text-white transition-colors">{i + 1}</div>
                <div>
                  <h4 className="text-xl font-bold text-[#0D4433] mb-2">{step.title}</h4>
                  <p className="text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>


        </div>
      </div>
    </div>
  );

  // QiblaPage inline component removed (Moved to external file)

  const CalendarDetailPage = () => {
    if (!selectedHijriContext) return null;
    const { hijri, date, isToday } = selectedHijriContext;
    const gregorianDate = date?.gregorian?.date || selectedHijriContext.gregorian?.date || 'N/A';

    return (
      <div className="min-h-screen bg-[#FDFCF8] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 animate-in slide-in-from-right-8 duration-500">
        <div className="max-w-4xl mx-auto">
          <SubHeader title="Date Details" />
          <div className="space-y-12">
            <div className="bg-white p-12 md:p-20 rounded-[4rem] border border-emerald-100 shadow-2xl text-center space-y-10">
              <div className="space-y-2">
                <div className="text-sm font-black text-emerald-600 uppercase tracking-[0.3em]">{hijri.month.en} {hijri.year}</div>
                <h1 className="text-6xl md:text-8xl font-black text-[#0D4433] tracking-tighter">{hijri.day}</h1>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Gregorian: {gregorianDate}</p>
                {isToday && <div className="inline-block mt-4 px-4 py-1 bg-[#0D4433] text-white text-[10px] font-black uppercase tracking-widest rounded-full">Today</div>}
              </div>
              <div className="h-px bg-emerald-50 w-24 mx-auto"></div>

              <div className="space-y-4">
                <h2 className="text-3xl font-serif font-bold text-[#1c2833]">Traditionally Observed</h2>
                <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mx-auto">
                  This date is commonly associated with reflection and gratitude in our tradition. Scholarly views may differ regarding the exact historical significance of specific calendar dates.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100/50">
                  <Info size={14} /> Scholarly views may differ
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-[#0D4433] p-10 rounded-[3rem] text-white space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Target size={80} /></div>
                <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50">Recommended Ibadah</h3>
                <p className="text-lg font-medium leading-relaxed">Focus on your five daily prayers and consider optional (Sunnah) fasts or extra dhikr if your schedule allows.</p>
              </div>
              <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 space-y-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-600">Historical Context</h3>
                <p className="text-sm text-gray-600 font-medium leading-relaxed">
                  Islamic history reminds us of the cycles of worship and the deep connections we share with the early community through these sacred timings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const CalendarPage = () => {
    const days = fullMonthCalendar;

    return (
      <div className="min-h-screen bg-[#FDFCF8] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-12">
          <SubHeader title="Hijri Calendar" />

          {/* 1️⃣ TODAY SUMMARY CARD (MANDATORY) */}
          {hijriInfo && (
            <div className="bg-[#0D4433] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-emerald-500/20">
              <div className="absolute top-0 right-0 p-12 opacity-5 text-emerald-300 group-hover:scale-110 transition-transform"><Moon size={120} /></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="text-center md:text-left space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.4em] opacity-50 mb-3">Today in Hijri</div>
                  <div className="text-4xl md:text-5xl font-serif font-bold">{hijriInfo.day} {hijriInfo.month.en} {hijriInfo.year}</div>
                  <div className="text-sm font-bold text-emerald-400/80 uppercase tracking-widest">
                    Gregorian: {currentTime.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/10 text-center max-w-[240px]">
                  <p className="text-xs font-medium leading-relaxed italic opacity-80">"A blessed day for remembrance and gratitude."</p>
                </div>
              </div>
            </div>
          )}

          {/* 2️⃣ CALENDAR GRID & WORKING NAVIGATION */}
          <div className="bg-white p-10 rounded-[4rem] border border-emerald-100 shadow-xl relative overflow-hidden">
            {isCalendarLoading && <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex items-center justify-center font-black text-[10px] uppercase tracking-[0.5em] text-[#0D4433]">Refreshing...</div>}
            <div className="flex justify-between items-center mb-12">
              <div className="space-y-1">
                <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Active Month</div>
                <h3 className="text-2xl font-serif font-bold text-[#0D4433]">
                  {days.length > 0 ? `${days[0].date.hijri.month.en} ${days[0].date.hijri.year}` : 'Hijri Month'}
                </h3>
              </div>
              <div className="flex gap-3">
                <button onClick={() => changeMonth(-1)} className="p-4 bg-gray-50 rounded-2xl text-[#0D4433] hover:bg-emerald-50 transition-all border border-gray-100 shadow-sm active:scale-95"><ChevronLeft size={20} /></button>
                <button onClick={() => changeMonth(1)} className="p-4 bg-gray-50 rounded-2xl text-[#0D4433] hover:bg-emerald-50 transition-all border border-gray-100 shadow-sm active:scale-95"><ChevronRight size={20} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-4 mb-8">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="text-center text-[10px] font-black text-gray-300 uppercase tracking-widest">{d}</div>)}

              {/* Padding for month start */}
              {days.length > 0 && Array.from({ length: viewDate.getDay() }).map((_, i) => <div key={`pad-${i}`} />)}

              {days.map((item, i) => {
                const hDay = parseInt(item.date.hijri.day);
                const isToday = item.isToday;
                const isSignificant = hDay === 1 || hDay === 13 || hDay === 14 || hDay === 15;

                return (
                  <div
                    key={i}
                    onClick={() => navigateTo('calendar-detail', {
                      hijri: item.date.hijri,
                      date: item.date,
                      isToday
                    })}
                    className={`aspect-square rounded-2xl flex items-center justify-center text-sm font-bold border transition-all cursor-pointer relative group ${isToday
                      ? 'bg-[#0D4433] text-white shadow-[0_15px_30px_rgba(13,68,51,0.4)] border-[#0D4433] scale-110 z-10'
                      : isSignificant
                        ? 'bg-emerald-50 text-[#0D4433] border-emerald-200'
                        : 'bg-white text-gray-400 border-gray-50 hover:border-emerald-100 hover:text-[#0D4433]'
                      }`}
                  >
                    {hDay}
                    {isSignificant && !isToday && <div className="absolute bottom-1.5 w-1 h-1 bg-[#0D4433] rounded-full" />}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-center gap-8 pt-6 border-t border-gray-50">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                <div className="w-3 h-3 bg-[#0D4433] rounded-md shadow-sm" /> Today
              </div>
              <div className="flex items-center gap-2 text-[9px] font-black uppercase text-gray-400 tracking-widest">
                <div className="w-3 h-3 bg-emerald-50 border border-emerald-200 rounded-md" /> Significant
              </div>
            </div>
          </div>

          {/* 3️⃣ SCHOLARLY NOTICES */}
          <div className="p-8 bg-[#FDFCF8] rounded-[3rem] border border-emerald-100/50 shadow-inner flex gap-6 items-start">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-50 shrink-0"><AlertCircle className="text-emerald-600" size={20} /></div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#0D4433]/40">Information Source</span>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">
                Hijri dates are based on expected lunar calculations. The actual sighting of the moon may vary by one to two days depending on your regional location and local authorities. Scholarly views may differ on historical associations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DuaPage = () => (
    <div className="min-h-screen bg-[#FDFCF8] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto">
        <SubHeader title="Daily Duas" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Morning Dua", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", translation: "We have reached the morning and the Kingdom belongs to Allah." },
            { title: "Evening Dua", arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ", translation: "We have reached the evening and the Kingdom belongs to Allah." },
            { title: "Before Sleeping", arabic: "بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا", translation: "In Your name, O Allah, I die and I live." },
            { title: "Upon Waking Up", arabic: "الْحَمْدُ لِلَّهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ", translation: "Praise be to Allah who gave us life after He caused us to die, and to Him is the resurrection." }
          ].map((dua, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm space-y-4">
              <h4 className="font-bold text-[#0D4433]">{dua.title}</h4>
              <p className="text-2xl font-serif text-right text-[#0D4433]" dir="rtl">{dua.arabic}</p>
              <p className="text-sm text-gray-500 font-medium italic">"{dua.translation}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ZakatCalcPage is now a top-level component (above IbadahDashboard) to prevent remount on parent re-render

  const ZakatResultPage = () => {
    if (!zakatResult) return null;
    const fmt = (n: number) => '₹\u00a0' + Math.round(n).toLocaleString('en-IN');
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="max-w-md space-y-10">
          <div className="w-32 h-32 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner">
            <Calculator size={64} className="text-emerald-500" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-serif font-bold text-[#0D4433]">Calculation Result</h2>
            <p className="text-gray-400 font-medium">Your estimated Zakat due for this year is:</p>
            <div className="text-6xl font-black text-[#0D4433] tracking-tighter">{fmt(zakatResult.zakatDue)}</div>
            <p className="text-xs text-gray-400">Net Assets: {fmt(zakatResult.netAssets)} &nbsp;|&nbsp; Nisab Threshold: {fmt(zakatResult.nisabThreshold)}</p>
            {zakatResult.netAssets < zakatResult.nisabThreshold && (
              <p className="text-sm text-emerald-600 font-semibold">Your assets are below the Nisab threshold — Zakat is not obligatory this year.</p>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 pt-8">
            <button onClick={() => setSubView('landing')} className="w-full py-6 bg-[#0D4433] text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-xl">Complete Assessment</button>
            <button onClick={() => setSubView('zakat-calc')} className="w-full py-6 bg-gray-50 text-gray-500 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px]">Recalculate</button>
          </div>
        </div>
      </div>
    )
  };

  // --- RENDER LOGIC ---

  if (subView === 'prayer-guide') return <PrayerGuidePage />;
  if (subView === 'qibla') return <QiblaPage onBack={() => setSubView('landing')} />;
  if (subView === 'dua') return <DuaPage />;
  if (subView === 'calendar') return <CalendarPage />;
  if (subView === 'calendar-detail') return <CalendarDetailPage />;
  if (subView === 'zakat-calc') return <ZakatCalcPage onResult={(r) => navigateTo('zakat-result', r)} onBack={goBack} />;
  if (subView === 'zakat-result') return <ZakatResultPage />;
  if (subView === 'quran') return <QuranPage onBack={() => setSubView('landing')} />;

  const TrackerSection = () => (
    <section className={`relative min-h-[60vh] md:min-h-[85vh] lg:min-h-[55vh] flex flex-col items-center justify-center px-6 pb-[10rem] md:pb-[18rem] lg:pb-[8rem] overflow-visible transition-all duration-[2000ms] ${theme.bg}`}>
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {activeHeroTheme === 'isha' && (
          <div className="absolute inset-0">
            {[...Array(40)].map((_, i) => (
              <Star key={i} className="absolute text-white animate-pulse" style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: Math.random() * 4 + 2, animationDelay: `${Math.random() * 5}s` }} />
            ))}
          </div>
        )}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[url('https://www.transparenttextures.com/patterns/pinstriped-suit.png')] opacity-20 rotate-12"></div>
      </div>
      <div className="relative z-10 text-center text-white mb-8 md:mb-24 lg:mb-12 transition-transform duration-700">
        <div className="mb-4 md:mb-8 lg:mb-4 flex justify-center hover:scale-110 transition-transform cursor-pointer drop-shadow-2xl">
          {theme.icon}
        </div>
        <p className="text-[10px] md:text-[12px] font-black tracking-[0.5em] uppercase opacity-80 mb-2 md:mb-4">{theme.label}</p>
        <h1 className="text-6xl md:text-[10rem] lg:text-8xl font-light tracking-tighter mb-6 md:mb-10 lg:mb-6 drop-shadow-md">
          {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </h1>
        <div className="inline-flex items-center gap-3 md:gap-4 px-6 md:px-10 py-3 md:py-4 bg-[#0D4433]/40 backdrop-blur-2xl rounded-full border border-white/30 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl">
          Next: <span className="text-emerald-400">{nextPrayer || 'Prayer'}</span> <span className="opacity-40">•</span> <span className="text-white">Guidance</span>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 w-full px-4 sm:px-6 lg:px-8 z-20">
        <div className="relative max-w-6xl mx-auto -mb-20 md:-mb-40 lg:-mb-24 group/tracker">
          <div
            className="bg-white rounded-[2rem] md:rounded-[4rem] p-2.5 sm:p-4 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] grid grid-cols-3 sm:grid-cols-5 items-center justify-between gap-1.5 sm:gap-3 md:gap-6 border border-white/50 overflow-x-hidden"
          >
            {(prayerTimes.length > 0 ? prayerTimes : [{ id: 1, name: 'Fajr', time: '---' }, { id: 2, name: 'Dhuhr', time: '---' }, { id: 3, name: 'Asr', time: '---' }, { id: 4, name: 'Maghrib', time: '---' }, { id: 5, name: 'Isha', time: '---' }] as PrayerTime[]).map((p) => {
              const isCompleted = completedPrayers.includes(p.name);
              const isActive = nextPrayer === p.name;
              return (
                <div
                  key={p.id}
                  onClick={() => navigateTo('prayer-guide', p)}
                  className={`flex flex-col items-center justify-center rounded-[1.5rem] md:rounded-[3rem] transition-all duration-700 cursor-pointer group/prayer relative overflow-hidden h-20 md:h-36 lg:h-28 ${isCompleted ? 'bg-emerald-50 text-emerald-600 opacity-60' : isActive ? 'bg-[#0D4433] text-white shadow-xl scale-100 md:scale-110 z-10' : 'bg-[#F9FAF2]/30 md:bg-transparent text-gray-400 border border-transparent hover:border-emerald-100'}`}
                >
                  <div onClick={(e) => { e.stopPropagation(); togglePrayerCompletion(p.name); }} className={`absolute top-2 right-2 md:top-4 md:right-4 w-4 h-4 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-200 text-transparent'}`}><CheckCircle2 size={10} /></div>
                  <span className={`text-[7px] md:text-[11px] font-black uppercase tracking-widest mb-0.5 md:mb-2 transition-colors ${isActive ? 'text-emerald-400' : 'group-hover/prayer:text-[#0D4433]'}`}>{p.name}</span>
                  <span className={`text-sm md:text-2xl font-black ${isActive ? 'text-white' : 'text-gray-900 opacity-40 group-hover/prayer:opacity-100'}`}>{p.time}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2D2D] pb-32 overflow-x-hidden">
      <TrackerSection />

      {/* MOBILE/TABLET LANDING FEATURE GRID */}
      <section className="lg:hidden max-w-7xl mx-auto px-4 sm:px-6 mt-24 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {/* Quran */}
          <div onClick={() => navigateTo('quran')} className="bg-[#0D4433] rounded-[2rem] p-5 border border-white/10 shadow-lg group active:scale-95 transition-all overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 opacity-10 text-white"><BookOpen size={80} /></div>
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20"><BookOpen className="w-5 h-5 text-white" /></div>
            <h3 className="text-lg font-black text-white">Quran</h3>
            <p className="text-emerald-100/60 text-[10px] font-medium truncate">Read & Listen</p>
          </div>
          {/* Qibla */}
          <div onClick={() => navigateTo('qibla')} className="bg-white rounded-[2rem] p-5 border border-emerald-100 shadow-sm group active:scale-95 transition-all overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 opacity-[0.05] text-[#0D4433]"><Compass size={80} /></div>
            <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center mb-4 border border-emerald-50"><Compass className="w-5 h-5 text-[#0D4433]" /></div>
            <h3 className="text-lg font-black text-[#1c2833]">Qibla</h3>
            <p className="text-gray-400 text-[10px] font-medium truncate">Find Direction</p>
          </div>
          {/* Hijri */}
          <div onClick={() => navigateTo('calendar')} className="bg-white rounded-[2rem] p-5 border border-emerald-100 shadow-sm group active:scale-95 transition-all overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 opacity-[0.05] text-[#0D4433]"><CalendarIcon size={80} /></div>
            <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center mb-4 border border-emerald-50"><CalendarIcon className="w-5 h-5 text-[#0D4433]" /></div>
            <h3 className="text-lg font-black text-[#1c2833]">Calendar</h3>
            <p className="text-gray-400 text-[10px] font-medium truncate">Hijri Dates</p>
          </div>
          {/* Zakat */}
          <div onClick={() => navigateTo('zakat-calc')} className="bg-white rounded-[2rem] p-5 border border-emerald-100 shadow-sm group active:scale-95 transition-all overflow-hidden relative">
            <div className="absolute -bottom-4 -right-4 opacity-[0.05] text-[#0D4433]"><Calculator size={80} /></div>
            <div className="w-10 h-10 bg-[#FDFCF8] rounded-xl flex items-center justify-center mb-4 border border-emerald-50"><Calculator className="w-5 h-5 text-[#0D4433]" /></div>
            <h3 className="text-lg font-black text-[#1c2833]">Zakat</h3>
            <p className="text-gray-400 text-[10px] font-medium truncate">Calculator</p>
          </div>
        </div>

        {/* New Mobile Widgets */}
        <HadithWidget />
        <TasbihWidget />
      </section>

      {/* DESKTOP LANDING LAYOUT (FULL SECTIONS) */}
      <section className="hidden lg:block max-w-7xl mx-auto px-6 xl:px-8 mt-64 space-y-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12">
          <div className="lg:col-span-8 space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div onClick={() => navigateTo('quran')} className="bg-[#0D4433] rounded-[3.5rem] p-10 border border-white/10 shadow-2xl group hover:-translate-y-3 transition-all cursor-pointer overflow-hidden relative">
                <div className="absolute -bottom-10 -right-10 opacity-10 text-white group-hover:scale-125 transition-transform duration-1000"><BookOpen size={200} /></div>
                <div className="w-16 h-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center mb-8 border border-white/20 group-hover:bg-emerald-500 transition-all shadow-md"><BookOpen className="w-8 h-8 text-white" /></div>
                <h3 className="text-2xl font-black text-white mb-2">Read Quran</h3>
                <p className="text-emerald-100/60 text-sm leading-relaxed mb-8 font-medium">Recite and listen with English translations and full audio support.</p>
                <div className="flex items-center gap-2 text-emerald-400 font-black text-[10px] uppercase tracking-widest">Resume Reading <ChevronRight size={14} /></div>
              </div>
              <div onClick={() => navigateTo('qibla')} className="bg-white rounded-[3.5rem] p-10 border border-emerald-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] group hover:-translate-y-3 transition-all cursor-pointer overflow-hidden relative">
                <div className="absolute -top-10 -right-10 opacity-[0.05] text-[#0D4433] group-hover:rotate-45 transition-transform duration-1000"><Compass size={200} /></div>
                <div className="w-16 h-16 bg-[#FDFCF8] rounded-[1.5rem] flex items-center justify-center mb-8 border border-emerald-50 group-hover:bg-[#0D4433] group-hover:text-white transition-all shadow-md"><Compass className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-[#1c2833] mb-2">Qibla Finder</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">Precision orientation with global interactive compass support.</p>
                <div className="flex items-center gap-2 text-[#0D4433] font-black text-[10px] uppercase tracking-widest">Open Compass <ChevronRight size={14} /></div>
              </div>
              <div onClick={() => navigateTo('calendar')} className="bg-white rounded-[3.5rem] p-10 border border-emerald-100 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] group hover:-translate-y-3 transition-all cursor-pointer overflow-hidden relative">
                <div className="absolute -bottom-10 -right-10 opacity-[0.05] text-[#0D4433] group-hover:-rotate-12 transition-transform duration-1000"><CalendarIcon size={200} /></div>
                <div className="w-16 h-16 bg-[#FDFCF8] rounded-[1.5rem] flex items-center justify-center mb-8 border border-emerald-50 group-hover:bg-[#0D4433] group-hover:text-white transition-all shadow-md"><CalendarIcon className="w-8 h-8" /></div>
                <h3 className="text-2xl font-black text-[#1c2833] mb-2">Hijri Calendar</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8 font-medium">Lunar cycles, moon sightings, and sacred months tracking.</p>
                <div className="flex items-center gap-2 text-[#0D4433] font-black text-[10px] uppercase tracking-widest">View Events <ChevronRight size={14} /></div>
              </div>
            </div>

            {/* New Desktop Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <HadithWidget />
              <TasbihWidget />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-12">

            <div className="bg-white rounded-[5rem] border border-emerald-100 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] p-14 group hover:border-emerald-300 transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-14">
                <div className="w-20 h-20 bg-[#FDFCF8] rounded-[2rem] flex items-center justify-center border border-emerald-100 group-hover:bg-[#0D4433] group-hover:text-white transition-all shadow-md"><Calculator className="w-10 h-10" /></div>
                <div className="text-right"><span className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Nisab (INR)</span><span className="font-black text-[#0D4433] text-3xl">₹52,051</span></div>
              </div>
              <h3 className="text-3xl font-black text-[#1c2833] mb-4">Zakat Manager</h3>
              <p className="text-gray-500 text-base leading-relaxed mb-12 font-medium">Precision calculation in Indian Rupees (₹) based on current gold and silver market rates.</p>
              <button onClick={() => navigateTo('zakat-calc')} className="w-full py-6 bg-emerald-50 text-[#0D4433] border border-emerald-100 rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-[#0D4433] hover:text-white transition-all shadow-sm">Open Calculator</button>
            </div>
            <div className="bg-[#FDFCF8] rounded-[3rem] p-10 flex flex-col gap-6 items-center text-center border border-emerald-100/50 shadow-inner">
              <div className="p-4 bg-white rounded-3xl shadow-md border border-emerald-50"><ShieldCheck className="w-8 h-8 text-emerald-600" /></div>
              <p className="text-[12px] text-emerald-900/50 font-black italic leading-relaxed uppercase tracking-[0.1em]">{GENERAL_DISCLAIMER}</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default IbadahDashboard;