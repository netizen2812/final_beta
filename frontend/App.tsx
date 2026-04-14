import React, { useState, useEffect, lazy, Suspense } from "react";
import { AppTab, Madhab, Tone } from "./types";
import { Icons } from "./constants";
import { ChildProvider } from "./contexts/ChildContext";
const CoreChat = lazy(() => import("./features/CoreChat"));
const IbadahDashboard = lazy(() => import("./features/IbadahDashboard"));
const LiveClassRoom = lazy(() => import("./features/LiveClassRoom"));
const ProfilePage = lazy(() => import("./features/ProfilePage"));
const AdminDashboard = lazy(() => import("./features/AdminDashboard"));
const AdminLiveDashboard = lazy(() => import("./features/AdminLiveDashboard"));
const HomeHub = lazy(() => import("./features/home/HomeHub"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
import Footer from "./components/Footer";
import XPRewardEffect from "./components/XPRewardEffect";
import { User, Settings, Radio, Home, Globe } from "lucide-react";

import {
  SignedIn,
  SignedOut,
  SignIn,
  SignInButton,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";


import axios from "axios";
import { APPLICATION_API_URL } from "./lib/api";

console.log("💓 App.tsx: Module Evaluation");

import { useHeartbeat } from "./hooks/useHeartbeat";
import { Analytics } from "./utils/analytics";
import { useTranslation } from "react-i18next";

const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', script: 'EN' },
  { code: 'hi', label: 'हिन्दी', script: 'हि' },
  { code: 'ur', label: 'اردو', script: 'اُ' },
  { code: 'ml', label: 'മലയാളം', script: 'മ' },
  { code: 'bn', label: 'বাংলা', script: 'বা' },
];

const getTabFromPath = (path: string): AppTab => {
  if (path.startsWith("/admin-live")) return AppTab.ADMIN_LIVE;
  if (path.startsWith("/admin")) return AppTab.ADMIN;
  if (path.startsWith("/chat")) return AppTab.CORE;
  if (path.startsWith("/ibadah")) return AppTab.IBADAH;
  if (path.startsWith("/tarbiyah")) return AppTab.LIVE;
  if (path.startsWith("/profile")) return AppTab.PROFILE;
  if (path.startsWith("/home")) return AppTab.HOME;
  return AppTab.HOME;
};
const LoadingFallback = () => (
  <div className="flex-1 flex items-center justify-center p-8">
    <div className="w-10 h-10 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
  </div>
);

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(() => getTabFromPath(window.location.pathname));
  const [madhab, setMadhab] = useState<Madhab>(Madhab.GENERAL);
  const [tone, setTone] = useState<Tone>(Tone.CALM);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  // Sync URL with active tab
  useEffect(() => {
    const pathMap: Record<AppTab, string> = {
      [AppTab.HOME]: "/home",
      [AppTab.CORE]: "/chat",
      [AppTab.IBADAH]: "/ibadah",
      [AppTab.LIVE]: "/tarbiyah",
      [AppTab.PROFILE]: "/profile",
      [AppTab.ADMIN]: "/admin",
      [AppTab.ADMIN_LIVE]: "/admin-live",
    };
    const newPath = pathMap[activeTab] || "/home";
    if (window.location.pathname !== newPath) {
      if (activeTab === AppTab.HOME && window.location.pathname === "/") {
        // stay on root
      } else {
        window.history.pushState(null, "", newPath);
      }
    }
  }, [activeTab]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromPath(window.location.pathname));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { t, i18n } = useTranslation();

  // 💓 Heartbeat for presence
  useHeartbeat();

  // 🌐 RTL handling
  useEffect(() => {
    const dir = i18n.language === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  const handleLanguageChange = async (langCode: string) => {
    i18n.changeLanguage(langCode);
    setShowLangDropdown(false);

    // Save to backend if logged in
    if (user) {
      try {
        const token = await getToken();
        await axios.patch(
          `${APPLICATION_API_URL}/api/users/language`,
          { language: langCode },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to save language preference:", err);
      }
    }
  };



  // 🔐 Sync user with backend after login
  useEffect(() => {
    const syncUser = async () => {
      try {
        if (!isLoaded || !user) return;

        const token = await getToken();

        const response = await axios.post(
          `${APPLICATION_API_URL}/api/users/sync`,
          {
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Auto-set language from user preference
        const preferredLang = response.data?.user?.preferredLanguage;
        if (preferredLang && ['en', 'hi', 'ur', 'ml', 'bn'].includes(preferredLang)) {
          i18n.changeLanguage(preferredLang);
        }

        // Initialize Analytics
        Analytics.init(user.id, (user.publicMetadata?.role as string) || 'parent', getToken);

        // Sync with Native Android Bridge (App Mode Only)
        if (import.meta.env.VITE_APP_MODE === 'app' && (window as any).Android?.onUserSignIn) {
          (window as any).Android.onUserSignIn(user.id);
        }

        console.log("User synced with backend ✅");
      } catch (error) {
        console.error("User sync failed ❌", error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  // 📊 Track Tab Changes
  useEffect(() => {
    Analytics.trackPageView(activeTab);
  }, [activeTab]);

  const appMode = import.meta.env.VITE_APP_MODE; // 'web' or 'app'

  const renderContent = () => {
    // 🛡️ AUTH CHECK: Some tabs require login (Ibadah is now guest-accessible)
    const requiresAuth = [AppTab.ADMIN, AppTab.ADMIN_LIVE, AppTab.PROFILE].includes(activeTab);

    
    if (requiresAuth && isLoaded && !user) {
      return (
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <SignIn
            appearance={{
              variables: { colorPrimary: "#052e16" },
              elements: { card: "shadow-none border-none" },
            }}
          />
        </div>
      );
    }

    return (
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          switch (activeTab) {
            case AppTab.HOME:
              return <HomeHub onNavigate={(tab) => setActiveTab(tab)} />;
            case AppTab.CORE:
              return (
                <CoreChat
                  madhab={madhab}
                  setMadhab={setMadhab}
                  tone={tone}
                  setTone={setTone}
                />
              );
            case AppTab.IBADAH:
              return <IbadahDashboard />;
            case AppTab.LIVE:
              return <LiveClassRoom />;
            case AppTab.ADMIN:
              return <AdminDashboard onNavigateToLive={() => setActiveTab(AppTab.ADMIN_LIVE)} />;
            case AppTab.ADMIN_LIVE:
              return <AdminLiveDashboard />;
            case AppTab.PROFILE:
              return <ProfilePage />;
            default:
              return <HomeHub onNavigate={(tab) => setActiveTab(tab)} />;
          }
        })()}
      </Suspense>
    );
  };

  const navItems = [
    { id: AppTab.HOME, label: t("nav.home"), icon: <Home /> },
    { id: AppTab.CORE, label: t("nav.chat"), icon: <Icons.Chat /> },
    { id: AppTab.IBADAH, label: t("nav.ibadah"), icon: <Icons.Prayer /> },
    { id: AppTab.LIVE, label: t("nav.tarbiyah", "Tarbiyah"), icon: <Icons.Book /> },
  ];

  const rootAdmins = ["sarthakjuneja1999@gmail.com", "huzaifbarkati0@gmail.com", "abhi.nebhani@gmail.com"];
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

  const isAdmin = user?.publicMetadata?.role === 'admin' || (userEmail && rootAdmins.includes(userEmail));

  if (isAdmin) {
    navItems.push({ id: AppTab.ADMIN, label: t("nav.admin"), icon: <Settings /> });
  }

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];
  const path = window.location.pathname;

  if (path === "/privacy") {
    return (
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <Privacy />
        </Suspense>
        <Footer />
      </div>
    );
  }

  if (path === "/terms") {
    return (
      <div className="flex flex-col min-h-screen">
        <Suspense fallback={<LoadingFallback />}>
          <Terms />
        </Suspense>
        <Footer />
      </div>
    );
  }

  return (
    <ChildProvider>
      <XPRewardEffect />
      {(appMode === 'app' && !isDesktop) ? (
        /* 📱 APP LAYOUT (MOBILE CONSTRAINED) */
        <div className="h-[100dvh] w-full flex flex-col bg-white relative overflow-hidden transition-all duration-500">
          {/* 🏥 HEADER */}
          <header
            className="absolute top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-[100] bg-white/90 backdrop-blur-xl border-b border-emerald-50/50 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <img src="/imam_logo.png" alt="Logo" className="h-7 object-contain" />
              <h1 className="text-base font-black tracking-tight text-[#052e16]">IMAM</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="px-2.5 py-1.5 bg-emerald-50/50 rounded-full text-[10px] font-bold text-[#052e16] flex items-center gap-1"
                >
                  <Globe size={12} />
                  {currentLang.script}
                </button>
                {showLangDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-emerald-100 z-[60] overflow-hidden">
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className="w-full px-4 py-2 text-left text-[10px] hover:bg-emerald-50"
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-5 py-2 bg-[#052e16] text-white rounded-full text-[11px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(5,46,22,0.3)] active:scale-95 transition-all animate-in fade-in slide-in-from-top-2 duration-500">
                    {t('nav.signIn', 'Sign In')}
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
              </SignedIn>

            </div>
          </header>

          {/* 📱 MAIN CONTENT (Scrollable Area) */}
          <main className={`flex-1 flex flex-col ${activeTab === AppTab.CORE ? 'overflow-hidden' : 'overflow-y-auto'} pt-20 pb-20 no-scrollbar overscroll-behavior-y-contain`}>
            {renderContent()}
            {activeTab !== AppTab.CORE && activeTab !== AppTab.HOME && <Footer />}
          </main>

          {/* 🧭 BOTTOM NAV (Instagram Style) */}
          <nav className="absolute bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-xl border-t border-emerald-50 flex items-center justify-around px-4 z-50">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center gap-1 transition-all ${isActive ? "text-[#052e16]" : "text-slate-300"}`}
                >
                  <div className={`p-2 rounded-xl transition-all ${isActive ? "bg-emerald-50 shadow-sm" : ""}`}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-bold tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ) : (
        /* 🌐 WEB LAYOUT (RESPONSIVE) */
        <div
          className={`min-h-screen flex ${isDesktop ? "flex-row" : "flex-col"} bg-white`}
        >
          {/* HEADER */}
          <header
            className={`fixed top-0 right-0 h-16 flex items-center justify-between px-6 z-[100] transition-all duration-300 ${isDesktop ? "left-64" : "left-0"}`}
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(12px)',
              borderBottom: '1px solid rgba(5,46,22,0.05)',
              boxShadow: '0 4px 20px rgba(5,46,22,0.02)',
            }}
          >
            <div className="flex items-center gap-2">
              <img
                src="/imam_logo.png"
                alt="Imam Logo"
                className="h-8 object-contain"
              />
              <h1 className="text-lg font-black tracking-tight text-[#052e16]">
                IMAM
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowLangDropdown(!showLangDropdown)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/80 border border-[#052e16]/10 rounded-full hover:bg-emerald-50 transition-all text-sm shadow-sm"
                  title={t("language.label")}
                >
                  <Globe size={14} className="text-[#052e16]/60" />
                  <span className="text-xs font-bold text-[#052e16]/70">{currentLang.script}</span>
                </button>

                {showLangDropdown && (
                  <>
                    <div className="fixed inset-0 z-[150]" onClick={() => setShowLangDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-2xl shadow-xl border border-emerald-100 overflow-hidden z-[200]">
                      {SUPPORTED_LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleLanguageChange(lang.code)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all ${i18n.language === lang.code
                            ? 'bg-emerald-50 text-[#052e16] font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          <span className="text-xs font-bold text-[#052e16]/60">{lang.script}</span>
                          <span className="text-xs font-semibold">{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveTab(AppTab.PROFILE)}
                className={`h-9 w-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${activeTab === AppTab.PROFILE
                  ? "bg-[#052e16] text-white"
                  : "bg-white border border-[#052e16]/10 text-[#052e16]"
                  }`}
              >
                <User size={16} />
              </button>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="px-5 py-2 bg-[#052e16] text-white rounded-full text-xs font-black uppercase tracking-widest shadow-xl hover:bg-[#052e16]/90 active:scale-95 transition-all">
                    {t('nav.signIn', 'Sign In')}
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
              </SignedIn>

            </div>
          </header>

          {/* DESKTOP SIDEBAR */}
          {isDesktop && (
            <aside className="w-64 h-screen fixed flex flex-col z-[110]"
              style={{
                background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,253,244,0.95) 100%)',
                borderRight: '1px solid rgba(5,46,22,0.07)',
                backdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-6 pt-7 pb-6">
                <div className="flex items-center gap-3">
                  <img src="/imam_logo.png" alt="Logo" className="h-10" />
                  <h1 className="text-2xl font-black text-[#052e16]">IMAM</h1>
                </div>
              </div>

              <nav className="flex-1 px-3 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === item.id ? 'bg-emerald-50 text-[#052e16] font-bold border' : 'text-slate-400'}`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>
            </aside>
          )}

          {/* MAIN CONTENT */}
          <main className={`flex-1 flex flex-col ${activeTab === AppTab.CORE ? 'overflow-hidden' : 'overflow-y-auto'} pt-20 pb-24 ${isDesktop ? "ml-64" : ""} overscroll-behavior-y-contain`}>
            {renderContent()}
            {activeTab !== AppTab.HOME && <Footer />}
          </main>

          {/* MOBILE NAV */}
          {!isDesktop && (
            <nav className="fixed bottom-0 left-0 right-0 glass-nav h-20 flex items-center justify-around px-2 z-[100]">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex flex-col items-center justify-center w-full h-full ${activeTab === item.id ? "text-[#052e16]" : "text-slate-400"}`}
                >
                  {item.icon}
                  <span className="text-[10px] mt-1 font-bold">{item.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      )}
    </ChildProvider>
  );
};

export default App;
