import React from 'react';
import { X } from 'lucide-react';
import QuranPage from './QuranPage';

interface QuranViewerProps {
  onClose: () => void;
}

export const QuranViewer: React.FC<QuranViewerProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-2xl" 
        onClick={onClose} 
      />

      {/* Viewer Modal */}
      <div className="relative w-full max-w-6xl h-full flex flex-col bg-white md:rounded-[3rem] overflow-hidden shadow-3xl">
        <div className="absolute top-6 right-8 z-[110]">
          <button 
            onClick={onClose}
            className="p-3 bg-black/5 hover:bg-black/10 text-gray-400 hover:text-black rounded-2xl transition-all border border-black/5"
          >
            <X size={20} />
          </button>
        </div>
        
        <div id="standalone-quran-modal-container" className="flex-1 overflow-y-auto">
          <QuranPage onBack={onClose} scrollContainerId="standalone-quran-modal-container" />
        </div>
      </div>
    </div>
  );
};
