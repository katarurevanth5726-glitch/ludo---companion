import React, { useState, useRef, useEffect } from 'react';
import { 
  GripHorizontal, 
  Minimize2, 
  Maximize2, 
  X, 
  Dices, 
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { Dice3D } from './Dice3D';
import { Player, DiceRoll } from '../types';
import { sound } from '../utils/sound';
import { triggerHaptic } from '../utils/rng';

interface FloatingWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  activePlayerId: string;
  onSelectPlayer: (id: string) => void;
  onRoll: (playerId: string) => void;
  isRolling: boolean;
  lastRoll: DiceRoll | null;
  totalRolls: number;
  sixCount: number;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  isOpen,
  onClose,
  players,
  activePlayerId,
  onSelectPlayer,
  onRoll,
  isRolling,
  lastRoll,
  totalRolls,
  sixCount,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Position initialized on mount based on viewport
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialX = Math.max(16, window.innerWidth - 300);
      const initialY = Math.max(70, 90);
      setPosition({ x: initialX, y: initialY });
    }
  }, []);

  // Clamp within viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => {
        const maxX = window.innerWidth - (isExpanded ? 280 : 130);
        const maxY = window.innerHeight - (isExpanded ? 340 : 70);
        return {
          x: Math.max(10, Math.min(prev.x, Math.max(10, maxX))),
          y: Math.max(60, Math.min(prev.y, Math.max(60, maxY))),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isExpanded]);

  // Window-level dragging event listeners for seamless touch and mouse movement
  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e: PointerEvent) => {
      const maxX = window.innerWidth - (isExpanded ? 280 : 130);
      const maxY = window.innerHeight - (isExpanded ? 340 : 70);

      const newX = Math.max(8, Math.min(e.clientX - dragOffset.x, maxX));
      const newY = Math.max(50, Math.min(e.clientY - dragOffset.y, maxY));

      setPosition({ x: newX, y: newY });
    };

    const onPointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('pointermove', onPointerMove, { passive: false });
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [isDragging, isExpanded, dragOffset]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    e.stopPropagation();
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  if (!isOpen) return null;

  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];
  const currentValue = lastRoll?.value || 6;

  const handleQuickRoll = () => {
    if (isRolling) return;
    onRoll(activePlayer.id);
  };

  return (
    <div
      ref={widgetRef}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
      }}
      className="fixed top-0 left-0 z-50 transition-[box-shadow] select-none touch-none"
    >
      {!isExpanded ? (
        /* COLLAPSED FLOATING PILL */
        <div
          onPointerDown={handlePointerDown}
          className="flex items-center gap-2.5 px-3 py-2 rounded-full bg-[#0B1020]/95 border-2 border-purple-500/70 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md cursor-grab active:cursor-grabbing hover:border-purple-400 transition-all group"
        >
          <GripHorizontal className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xs font-black text-white shadow">
            {currentValue}
          </div>
          <span className="text-xs font-bold text-slate-200">
            {activePlayer.name.slice(0, 6)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              setIsExpanded(true);
            }}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="Expand Floating HUD"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* EXPANDED COMPANION PANEL */
        <div className="w-[260px] sm:w-[270px] bg-[#0B1020]/95 border-2 border-purple-500/60 rounded-3xl shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-lg overflow-hidden text-slate-100">
          {/* Header & Drag Handle */}
          <div
            onPointerDown={handlePointerDown}
            className="px-3.5 py-2.5 bg-gradient-to-r from-[#12182F] via-[#1A2342] to-[#12182F] border-b border-indigo-950/80 flex items-center justify-between cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                HUD COMPANION
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setIsExpanded(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                title="Collapse"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  onClose();
                }}
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Panel Body */}
          <div className="p-3.5 space-y-3">
            {/* Player Switcher Tabs */}
            <div className="flex items-center gap-1 p-1 bg-[#12182F] rounded-xl border border-indigo-950/70 overflow-x-auto">
              {players.map((p) => {
                const isSelected = p.id === activePlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      sound.playClick();
                      onSelectPlayer(p.id);
                    }}
                    className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold truncate transition-all ${
                      isSelected
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Central Dice Face Preview */}
            <div className="flex flex-col items-center justify-center py-2">
              <Dice3D
                value={currentValue}
                isRolling={isRolling}
                size="md"
                colorTheme={activePlayer.color}
              />
              <div className="mt-2 text-[11px] font-bold text-slate-300">
                {isRolling ? (
                  <span className="text-purple-400 animate-pulse">Rolling...</span>
                ) : lastRoll ? (
                  <span>
                    Rolled <strong className="text-amber-400 text-sm font-mono">#{currentValue}</strong>
                    {currentValue === 6 && <span className="ml-1 text-amber-300 font-mono">★</span>}
                  </span>
                ) : (
                  <span className="text-slate-500">Ready to roll</span>
                )}
              </div>
            </div>

            {/* Quick Roll Button */}
            <button
              onClick={handleQuickRoll}
              disabled={isRolling}
              className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 active:scale-95 text-white font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Dices className={`w-4 h-4 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Rolling...' : `Roll for ${activePlayer.name}`}</span>
            </button>

            {/* Micro Stats Row */}
            <div className="px-2.5 py-1.5 rounded-xl bg-[#12182F] border border-indigo-950/60 flex items-center justify-between text-[10px] text-slate-400">
              <span>Total: <strong className="text-white font-mono">{totalRolls}</strong></span>
              <span>6s: <strong className="text-amber-400 font-mono">{sixCount}</strong></span>
              <span>Rate: <strong className="text-purple-300 font-mono">
                {totalRolls > 0 ? Math.round((sixCount / totalRolls) * 100) : 0}%
              </strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
