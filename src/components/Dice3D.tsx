import React from 'react';
import { PlayerColor } from '../types';

interface Dice3DProps {
  value: number; // 1 to 6
  isRolling: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  colorTheme?: PlayerColor | 'purple' | 'cyan';
  showGlow?: boolean;
}

interface ThemeStyle {
  glow: string;
  faceBg: string;
  dotBg: string;
  highlightDot: string;
}

const THEME_ACCENTS: Record<string, ThemeStyle> = {
  purple: {
    glow: 'shadow-[0_0_35px_rgba(168,85,247,0.45)] border-purple-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#16132D] to-purple-950',
    dotBg: 'bg-purple-300 shadow-[0_0_8px_rgba(216,180,254,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
  cyan: {
    glow: 'shadow-[0_0_35px_rgba(56,189,248,0.45)] border-cyan-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#0C2338] to-cyan-950',
    dotBg: 'bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
  green: {
    glow: 'shadow-[0_0_35px_rgba(34,197,94,0.45)] border-emerald-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#0B251A] to-emerald-950',
    dotBg: 'bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
  red: {
    glow: 'shadow-[0_0_35px_rgba(239,68,68,0.45)] border-red-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#2A0E12] to-red-950',
    dotBg: 'bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
  blue: {
    glow: 'shadow-[0_0_35px_rgba(59,130,246,0.45)] border-blue-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#0D1C38] to-blue-950',
    dotBg: 'bg-blue-300 shadow-[0_0_8px_rgba(147,197,253,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
  yellow: {
    glow: 'shadow-[0_0_35px_rgba(234,179,8,0.45)] border-amber-400/80',
    faceBg: 'bg-gradient-to-br from-slate-900 via-[#26200A] to-amber-950',
    dotBg: 'bg-amber-300 shadow-[0_0_8px_rgba(253,224,71,0.9)]',
    highlightDot: 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,1)]',
  },
};

export const Dice3D: React.FC<Dice3DProps> = ({
  value,
  isRolling,
  size = 'lg',
  colorTheme = 'purple',
  showGlow = true,
}) => {
  const safeVal = Math.max(1, Math.min(6, value || 6));

  const sizeStyles = {
    sm: {
      container: 'w-10 h-10',
      dot: 'w-2 h-2',
      radius: 'rounded-xl',
      border: 'border',
    },
    md: {
      container: 'w-16 h-16',
      dot: 'w-3 h-3',
      radius: 'rounded-2xl',
      border: 'border-2',
    },
    lg: {
      container: 'w-28 h-28',
      dot: 'w-5 h-5',
      radius: 'rounded-3xl',
      border: 'border-2',
    },
    xl: {
      container: 'w-36 h-36',
      dot: 'w-6 h-6',
      radius: 'rounded-[32px]',
      border: 'border-3',
    },
  }[size];

  const themeAccent = THEME_ACCENTS[colorTheme] || THEME_ACCENTS.purple;
  const dotColorClass = safeVal === 6 ? themeAccent.highlightDot : themeAccent.dotBg;

  // Render authentic 3x3 dice dot patterns
  const renderPips = () => {
    const dot = `${sizeStyles.dot} ${dotColorClass} rounded-full transition-all duration-200`;

    switch (safeVal) {
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${size === 'lg' || size === 'xl' ? 'w-8 h-8' : sizeStyles.dot} ${dotColorClass} rounded-full animate-pulse`} />
          </div>
        );
      case 2:
        return (
          <div className="absolute inset-0 p-[20%] flex flex-col justify-between">
            <div className="flex justify-end"><div className={dot} /></div>
            <div className="flex justify-start"><div className={dot} /></div>
          </div>
        );
      case 3:
        return (
          <div className="absolute inset-0 p-[18%] flex flex-col justify-between">
            <div className="flex justify-end"><div className={dot} /></div>
            <div className="flex justify-center"><div className={dot} /></div>
            <div className="flex justify-start"><div className={dot} /></div>
          </div>
        );
      case 4:
        return (
          <div className="absolute inset-0 p-[18%] flex flex-col justify-between">
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
          </div>
        );
      case 5:
        return (
          <div className="absolute inset-0 p-[18%] flex flex-col justify-between">
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
            <div className="flex justify-center"><div className={dot} /></div>
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
          </div>
        );
      case 6:
      default:
        return (
          <div className="absolute inset-0 p-[16%] flex flex-col justify-between">
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
            <div className="flex justify-between"><div className={dot} /><div className={dot} /></div>
          </div>
        );
    }
  };

  return (
    <div className="relative flex items-center justify-center select-none" style={{ perspective: '1000px' }}>
      {/* Ambient background glow ring when 6 is rolled */}
      {safeVal === 6 && !isRolling && showGlow && (
        <div className="absolute -inset-4 bg-amber-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
      )}

      {/* Main 3D Tumbling Cube Body */}
      <div
        className={`relative ${sizeStyles.container} ${sizeStyles.radius} ${sizeStyles.border} ${themeAccent.faceBg} ${
          showGlow ? themeAccent.glow : 'border-slate-700/80'
        } shadow-2xl transition-all flex items-center justify-center cursor-pointer active:scale-95 ${
          isRolling
            ? 'animate-spin duration-300'
            : safeVal === 6
            ? 'scale-105 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
            : ''
        }`}
      >
        {/* Beveled glass highlight reflection */}
        <div className="absolute inset-1 rounded-2xl bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

        {/* Dice dots */}
        {renderPips()}
      </div>
    </div>
  );
};
