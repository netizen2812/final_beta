import React from 'react';
import QuranPage from '../QuranPage';

interface ActiveStudentFocusProps {
  activeChildId: string | null;
  activeStudentSurah?: number;
  activeStudentAyah?: number;
  isMobile?: boolean;
}

export const ActiveStudentFocus: React.FC<ActiveStudentFocusProps> = ({
  activeChildId,
  activeStudentSurah,
  activeStudentAyah,
}) => {
  return (
    <div 
        id="scholar-quran-container" 
        className={`flex-1 rounded-[2.5rem] border border-emerald-900/40 shadow-2xl overflow-hidden relative group flex flex-col md:flex-1 transition-all duration-700 pointer-events-none ${!activeChildId ? 'opacity-0 scale-95 pointer-events-none h-0 md:h-auto' : 'opacity-100 scale-100 h-full'}`} 
        style={{ background: '#fdfaf3' }}
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-40" />
      {activeChildId && (
        <QuranPage
          onBack={() => {}}
          sessionCurrentSurah={activeStudentSurah}
          sessionCurrentAyah={activeStudentAyah}
          onAyahClick={() => {}}
          readOnly={true}
          scrollContainerId="scholar-quran-container"
        />
      )}
    </div>
  );
};
