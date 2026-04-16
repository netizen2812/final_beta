import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  X, ChevronLeft, ChevronRight, Languages, 
  Maximize2, Minimize2, ZoomIn, ZoomOut, 
  Share2, Shield, Loader2, Globe, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Setup PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface QaidaViewerProps {
  onClose: () => void;
  isScholar?: boolean;
  batchId?: string;
  initialLanguage?: 'english' | 'hindi' | 'urdu';
  followScholar?: boolean;
  onSyncUpdate?: (lang: string, page: number) => void;
  forcedLanguage?: 'english' | 'hindi' | 'urdu';
  forcedPage?: number;
}


const LANGUAGES = [
  { id: 'english', label: 'English', native: 'English', maxPage: 70 },
  { id: 'hindi', label: 'Hindi', native: 'हिन्दी', maxPage: 49 },
  { id: 'urdu', label: 'Urdu', native: 'اردو', maxPage: 49 }
];

export const QaidaViewer: React.FC<QaidaViewerProps> = ({ 
  onClose, 
  isScholar = false, 
  batchId, 
  initialLanguage = 'english',
  followScholar = true,
  onSyncUpdate,
  forcedLanguage,
  forcedPage
}) => {

  const [language, setLanguage] = useState<'english' | 'hindi' | 'urdu'>(initialLanguage);
  const [pageNumber, setPageNumber] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(isScholar);

  const currentLangConfig = LANGUAGES.find(l => l.id === language)!;

  // 📡 Broadcast Sync (Report to Parent)
  useEffect(() => {
    if (isScholar && onSyncUpdate) {
      onSyncUpdate(language, pageNumber);
    }
  }, [language, pageNumber, isScholar, onSyncUpdate]);

  // 📡 Follow Mode (React to Parent)
  useEffect(() => {
    if (!isScholar && followScholar) {
      if (forcedLanguage) setLanguage(forcedLanguage);
      if (forcedPage) setPageNumber(forcedPage);
    }
  }, [forcedLanguage, forcedPage, isScholar, followScholar]);


  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const changePage = (offset: number) => {
    const next = pageNumber + offset;
    if (next >= 1 && next <= currentLangConfig.maxPage) {
      setPageNumber(next);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
        onClick={onClose} 
      />

      {/* Viewer Modal */}
      <div className="relative w-full max-w-5xl h-full flex flex-col bg-[#052e16]/20 border-x md:border border-emerald-500/20 md:rounded-[3rem] overflow-hidden shadow-3xl backdrop-blur-xl">
        
        {/* Top Header */}
        <div className="flex-none px-4 md:px-8 py-4 md:py-6 flex items-center justify-between border-b border-white/5 bg-black/40">
          <div className="flex items-center gap-3 md:gap-4">
             <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                <Sparkles className="text-emerald-400" size={16} />
             </div>
             <div>
                <h3 className="text-white font-black uppercase text-[10px] md:text-sm tracking-widest leading-none">Madani Qaida</h3>
                <p className="text-emerald-500/40 text-[7px] md:text-[9px] font-bold uppercase tracking-widest mt-1 md:mt-1.5 flex items-center gap-1.5 md:gap-2">
                   {isScholar ? (
                     <><Shield size={8} /> Presentation Mode</>
                   ) : (
                     <><Globe size={8} /> {followScholar ? 'View Locked to Scholar' : 'Self Study'}</>
                   )}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             {/* Language Toggles */}
             <div className="flex bg-black/40 p-0.5 md:p-1 rounded-lg md:rounded-2xl border border-white/5 mr-1 md:mr-4">
                {LANGUAGES.map(lang => (
                   <button
                     key={lang.id}
                     disabled={!isScholar && followScholar}
                     onClick={() => {
                        setLanguage(lang.id as any);
                        setPageNumber(1);
                     }}
                     className={`px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${
                       language === lang.id 
                       ? 'bg-emerald-500 text-black shadow-lg' 
                       : 'text-white/40 hover:text-white/70 disabled:opacity-30'
                     }`}
                   >
                     <span className="md:hidden">{lang.label.substring(0, 2)}</span>
                     <span className="hidden md:inline">{lang.label}</span>
                   </button>
                ))}
             </div>
                {LANGUAGES.map(lang => (
                   <button
                     key={lang.id}
                     onClick={() => {
                        setLanguage(lang.id as any);
                        setPageNumber(1);
                     }}
                     className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                       language === lang.id 
                       ? 'bg-emerald-500 text-black shadow-lg' 
                       : 'text-white/40 hover:text-white/70'
                     }`}
                   >
                     {lang.label}
                   </button>
                ))}
             </div>

             <button 
               onClick={onClose}
               className="p-3 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-2xl transition-all border border-white/5"
             >
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto bg-black relative group flex justify-center custom-scrollbar">
           {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/90 backdrop-blur-md">
                 <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
                 <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-widest">Opening Lessons...</p>
              </div>
           )}

           <div className={`p-2 md:p-8 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`} style={{ direction: language === 'urdu' ? 'rtl' : 'ltr' }}>
              <Document
                file={`/qaida/${language}.pdf`}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={null}
              >
                <Page 
                  pageNumber={pageNumber} 
                  scale={scale * (window.innerWidth < 768 ? 0.6 : 1.0)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="shadow-2xl rounded-sm md:rounded-lg overflow-hidden border border-white/10"
                />
              </Document>
           </div>

           {/* Zoom Controls */}
           <div className="absolute bottom-10 right-10 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setScale(s => Math.min(s + 0.2, 3))} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-emerald-500/20 transition-all"><ZoomIn size={18} /></button>
              <button onClick={() => setScale(s => Math.max(s - 0.2, 0.5))} className="p-3 bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-emerald-500/20 transition-all"><ZoomOut size={18} /></button>
           </div>
        </div>

        {/* Navigation Footer */}
        <div className="flex-none px-4 md:px-10 py-4 md:py-8 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 md:gap-8 w-full md:w-auto justify-between md:justify-start">
               <button 
                 onClick={() => changePage(-1)}
                 disabled={pageNumber <= 1 || (!isScholar && followScholar)}
                 className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-all active:scale-90 disabled:opacity-20 disabled:scale-100"
               >
                  <ChevronLeft size={24} className="md:w-7 md:h-7" />
               </button>

               <div className="flex flex-col items-center">
                  <span className="text-[8px] md:text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.2em] mb-0.5 md:mb-1">Page</span>
                  <div className="flex items-baseline gap-1.5 md:gap-2">
                     <span className="text-xl md:text-3xl font-black text-white">{pageNumber}</span>
                     <span className="text-white/20 text-xs md:text-sm font-bold">/ {currentLangConfig.maxPage}</span>
                  </div>
               </div>

               <button 
                 onClick={() => changePage(1)}
                 disabled={pageNumber >= currentLangConfig.maxPage || (!isScholar && followScholar)}
                 className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-white/5 hover:bg-emerald-500/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-emerald-400 transition-all active:scale-90 disabled:opacity-20 disabled:scale-100"
               >
                  <ChevronRight size={24} className="md:w-7 md:h-7" />
               </button>
            </div>

            {/* Page Slider */}
            <div className={`flex-1 w-full max-w-md mx-0 md:mx-10 transition-opacity ${!isScholar && followScholar ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
               <input 
                 type="range"
                 min="1"
                 max={currentLangConfig.maxPage}
                 value={pageNumber}
                 disabled={!isScholar && followScholar}
                 onChange={(e) => setPageNumber(parseInt(e.target.value))}
                 className="w-full appearance-none h-1.5 bg-white/10 rounded-full overflow-hidden [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-runnable-track]:h-full transition-all"
               />
               <div className="flex justify-between mt-2 md:mt-3">
                  <span className="text-[7px] md:text-[8px] text-white/20 font-black uppercase tracking-widest italic">Locked To Maulana</span>
                  <span className="text-[7px] md:text-[8px] text-white/20 font-black uppercase tracking-widest">End of Qaida</span>
               </div>
            </div>

            <div className="flex items-center gap-4">
                {isScholar && (
                   <div className="flex items-center gap-3 px-6 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <div className={`w-2 h-2 rounded-full ${syncEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-white/20'}`} />
                      <span className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Scholar Controls Sync</span>
                   </div>
                )}
                
                {!isScholar && (
                   <button 
                     onClick={() => {/* Toggle Follow Mode */}} 
                     className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3 group"
                   >
                      <Share2 size={14} className="text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] text-white/60 font-black uppercase tracking-widest">Follow Maulana</span>
                   </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
