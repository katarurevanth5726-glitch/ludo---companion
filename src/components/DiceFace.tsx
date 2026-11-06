import React from 'react';

interface DiceFaceProps {
  value: number; // 1 to 6
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'gold' | 'cyan' | 'neutral';
  isSelected?: boolean;
}

export const DiceFace: React.FC<DiceFaceProps> = ({
  value,
  size = 'md',
  variant = 'gold',
  isSelected = false,
}) => {
  const safeVal = Math.max(1, Math.min(6, value));

  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-14 h-14 rounded-2xl text-base',
    xl: 'w-20 h-20 rounded-3xl text-xl',
  }[size];

  // Pip sizes
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
    xl: 'w-3.5 h-3.5',
  }[size];

  const dotColor = isSelected
    ? 'bg-amber-400'
    : variant === 'gold'
    ? 'bg-amber-300'
    : variant === 'cyan'
    ? 'bg-cyan-300'
    : 'bg-slate-300';

  // Render 3x3 grid dots for standard dice faces
  const renderDots = () => {
    switch (safeVal) {
      case 1:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`${dotSize} ${dotColor} rounded-full shadow-sm`} />
          </div>
        );
      case 2:
        return (
          <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
            <div className="flex justify-end">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-start">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
            <div className="flex justify-end">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-center">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-start">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
          </div>
        );
      case 4:
        return (
          <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
          </div>
        );
      case 5:
        return (
          <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-center">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
          </div>
        );
      case 6:
      default:
        return (
          <div className="absolute inset-0 p-1.5 flex flex-col justify-between">
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
            <div className="flex justify-between">
              <div className={`${dotSize} ${dotColor} rounded-full`} />
              <div className={`${dotSize} ${dotColor} rounded-full`} />
            </div>
          </div>
        );
    }
  };

  return (
    <div
      className={`relative ${sizeClasses} select-none transition-all duration-150 flex items-center justify-center ${
        isSelected
          ? 'bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
          : 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700/80 hover:border-slate-500 shadow-md'
      }`}
    >
      {renderDots()}
    </div>
  );
};
