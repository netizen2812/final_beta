import React, { useState, useEffect } from "react";
import { AppTab, Madhab, Tone } from "./types";
import { Icons } from "./constants";
import { ChildProvider } from "./contexts/ChildContext";
import CoreChat from "./features/CoreChat";
import IbadahDashboard from "./features/IbadahDashboard";
import TarbiyahLearning from "./features/TarbiyahLearning";
import LiveClassRoom from "./features/LiveClassRoom";
import ProfilePage from "./features/ProfilePage";
import WelcomeScreen from "./features/WelcomeScreen";
import AdminDashboard from "./features/AdminDashboard";
import AdminLiveDashboard from "./features/AdminLiveDashboard";
import HomeHub from "./features/home/HomeHub";
import { User, Settings, Radio, Home } from "lucide-react";

import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  useUser,
  useAuth,
} from "@clerk/clerk-react";

import axios from "axios";

import { useHeartbeat } from "./hooks/useHeartbeat";

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.HOME);
  const [madhab, setMadhab] = useState<Madhab>(Madhab.GENERAL);
  const [tone, setTone] = useState<Tone>(Tone.CALM);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();

  // 💓 Heartbeat for presence
  useHeartbeat();

  // Welcome Video Logic
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Show welcome video once per session
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleVideoEnd = () => {
    setShowWelcome(false);
    sessionStorage.setItem("hasSeenWelcome", "true");
  };

  // 🔐 Sync user with backend after login
  useEffect(() => {
    const syncUser = async () => {
      try {
        if (!isLoaded || !user) return;

        const token = await getToken();

        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
        await axios.post(
          `${API_URL}/api/users/sync`,
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

        console.log("User synced with backend ✅");
      } catch (error) {
        console.error("User sync failed ❌", error);
      }
    };

    syncUser();
  }, [user, isLoaded]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const renderContent = () => {
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
      case AppTab.TARBIYAH:
        return <TarbiyahLearning onNavigateToProfile={() => setActiveTab(AppTab.PROFILE)} />;
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
  };

  const navItems = [
    { id: AppTab.HOME, label: "Home", icon: <Home /> },
    { id: AppTab.CORE, label: "Chat", icon: <Icons.Chat /> },
    { id: AppTab.IBADAH, label: "Ibadah", icon: <Icons.Prayer /> },
    { id: AppTab.TARBIYAH, label: "Tarbiyah", icon: <Icons.Book /> },
    { id: AppTab.LIVE, label: "Live", icon: <Icons.Live /> },
  ];

  if (user?.primaryEmailAddress?.emailAddress?.toLowerCase() === "sarthakjuneja1999@gmail.com") {
    navItems.push({ id: AppTab.ADMIN, label: "Admin", icon: <Settings /> });
  }

  return (
    <>
      {/* 🎥 WELCOME VIDEO OVERLAY */}
      {showWelcome && <WelcomeScreen onComplete={handleVideoEnd} />}

      {/* 🔓 LOGGED OUT SCREEN */}
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-white px-4">
          <div className="w-full max-w-md">
            <SignIn
              appearance={{
                variables: {
                  colorPrimary: "#052e16",
                },
                elements: {
                  card: "shadow-2xl rounded-2xl",
                },
              }}
            />
          </div>
        </div>
      </SignedOut>

      {/* 🔐 LOGGED IN APP */}
      <SignedIn>
        <ChildProvider>
          <div
            className={`min-h-screen flex ${isDesktop ? "flex-row" : "flex-col"
              } bg-white`}
          >
            {/* HEADER */}
            <header
              className={`fixed top-0 right-0 h-16 flex items-center justify-between px-6 z-[100] transition-all duration-300 ${isDesktop ? "left-64" : "left-0"
                }`}
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

              {activeTab === AppTab.PROFILE ? (
                <UserButton
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox:
                        "h-9 w-9 rounded-full shadow-lg shadow-[#052e16]/10 border border-[#052e16]/10",
                    },
                  }}
                />
              ) : (
                <button
                  onClick={() => setActiveTab(AppTab.PROFILE)}
                  title="My Profile"
                  className={`h-9 w-9 rounded-full flex items-center justify-center transition-all active:scale-95 ${activeTab === AppTab.PROFILE
                    ? "bg-[#052e16] text-white shadow-lg"
                    : "bg-white border border-[#052e16]/10 text-[#052e16] hover:bg-emerald-50 shadow-sm"
                    }`}
                >
                  <User size={16} />
                </button>
              )}
            </header>

            {/* DESKTOP SIDEBAR */}
            {isDesktop && (
              <aside className="w-64 h-screen fixed flex flex-col z-[110] overflow-hidden"
                style={{
                  background: 'linear-gradient(160deg, rgba(255,255,255,0.97) 0%, rgba(240,253,244,0.95) 100%)',
                  borderRight: '1px solid rgba(5,46,22,0.07)',
                  boxShadow: '4px 0 32px rgba(5,46,22,0.06), inset -1px 0 0 rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                {/* Inner top highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent" />

                {/* Brand Header */}
                <div className="px-6 pt-7 pb-6">
                  <div className="flex items-center gap-3 mb-1">
                    <img
                      src="/imam_logo.png"
                      alt="Imam Logo"
                      className="h-10 object-contain"
                    />
                    <h1 className="text-2xl font-black tracking-tight text-[#052e16]">
                      IMAM
                    </h1>
                  </div>
                  {/* Accent line */}
                  <div className="mt-4 h-px bg-gradient-to-r from-emerald-200/80 via-emerald-100/40 to-transparent" />
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 relative group"
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,244,0.9) 100%)',
                          boxShadow: '0 4px 20px rgba(5,46,22,0.10), 0 1px 4px rgba(5,46,22,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
                          border: '1px solid rgba(5,46,22,0.10)',
                        } : {
                          background: 'transparent',
                          border: '1px solid transparent',
                        }}
                      >
                        {/* Active left accent bar */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-gradient-to-b from-emerald-500 to-emerald-700" />
                        )}

                        {/* Icon */}
                        <span className={`transition-all duration-200 ${isActive
                          ? 'text-[#052e16]'
                          : 'text-[#052e16]/30 group-hover:text-[#052e16]/60'
                          }`}>
                          {item.icon}
                        </span>

                        {/* Label */}
                        <span className={`text-sm font-bold tracking-wide transition-all duration-200 ${isActive
                          ? 'text-[#052e16]'
                          : 'text-[#052e16]/40 group-hover:text-[#052e16]/70'
                          }`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </nav>

                {/* Bottom ambient glow */}
                <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(240,253,244,0.6) 0%, transparent 100%)' }}
                />

                {/* Bottom padding spacer */}
                <div className="h-6" />
              </aside>
            )}

            {/* MAIN CONTENT */}
            <main
              className={`flex-1 overflow-y-auto pt-16 pb-24 ${isDesktop ? "ml-64" : ""
                }`}
            >
              <div className="w-full h-full">
                {renderContent()}
              </div>
            </main>

            {/* MOBILE NAV */}
            {!isDesktop && (
              <nav className="fixed bottom-0 left-0 right-0 glass-nav h-20 flex items-center justify-around px-2 z-[100]">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === item.id
                      ? "text-[#052e16]"
                      : "text-slate-400"
                      }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg transition-all ${activeTab === item.id
                        ? "bg-[#052e16]/10 scale-110"
                        : ""
                        }`}
                    >
                      {item.icon}
                    </div>
                    <span className="text-[10px] mt-1 font-bold">
                      {item.label}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </ChildProvider>
      </SignedIn>
    </>
  );
};

export default App;
