import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Star } from 'lucide-react';
import { useChildContext } from '../contexts/ChildContext';

interface Particle {
  id: number;
  x: number;
  y: number;
  delay: number;
}

const XPRewardEffect: React.FC = () => {
  const { lastReward } = useChildContext();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showTotal, setShowTotal] = useState<number | null>(null);

  useEffect(() => {
    if (lastReward) {
      // Create 8-12 particles
      const newParticles = Array.from({ length: 10 }).map((_, i) => ({
        id: lastReward.id + i,
        x: 50 + (Math.random() * 20 - 10), // start near center horizontal
        y: 60 + (Math.random() * 20 - 10), // start middle-bottom
        delay: i * 0.05,
      }));
      setParticles(prev => [...prev, ...newParticles]);
      setShowTotal(lastReward.amount);

      // Cleanup particles after animation
      const timer = setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 2000);

      // Cleanup total amount display
      const totalTimer = setTimeout(() => {
        setShowTotal(null);
      }, 2500);

      return () => {
        clearTimeout(timer);
        clearTimeout(totalTimer);
      };
    }
  }, [lastReward]);

  if (particles.length === 0 && showTotal === null) return null;

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[1000000] overflow-hidden">
      <style>{`
        @keyframes xp-fly {
          0% {
            transform: translate(0, 0) scale(0);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate(0, -40px) scale(1.5);
          }
          100% {
            transform: translate(calc(-40vw + 20px), -75vh) scale(0.3);
            opacity: 0;
          }
        }
        @keyframes xp-reveal {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; filter: blur(10px); }
          30% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; filter: blur(0); }
          70% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
        .xp-particle {
          position: absolute;
          left: 50%;
          top: 60%;
          animation: xp-fly 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          color: #fbbf24;
          filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
        }
        .xp-total {
          position: absolute;
          left: 50%;
          top: 50%;
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 4rem;
          color: #10b981;
          text-shadow: 0 0 20px rgba(16, 185, 129, 0.4);
          animation: xp-reveal 1.5s ease-out forwards;
        }
      `}</style>

      {showTotal !== null && (
        <div className="xp-total flex items-center gap-2">
           <Sparkles className="text-amber-400" size={48} />
           +{showTotal} XP
        </div>
      )}

      {particles.map(p => (
        <div 
          key={p.id} 
          className="xp-particle"
          style={{ 
            animationDelay: `${p.delay}s`,
            left: `${p.x}%`,
            top: `${p.y}%`
          }}
        >
          <Star size={24} fill="currentColor" />
        </div>
      ))}
    </div>,
    document.body
  );
};

export default XPRewardEffect;
