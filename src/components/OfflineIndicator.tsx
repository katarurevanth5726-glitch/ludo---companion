import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../utils/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      role="status" 
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-amber-500/90 text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-md border border-amber-400 animate-pulse"
    >
      <WifiOff className="w-4 h-4 text-slate-950 shrink-0" />
      <span>Offline Mode — All features &amp; LocalStorage active</span>
    </div>
  );
};
