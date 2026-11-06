import React from 'react';
import { Home, Dices, Users, History, Settings, Sparkles, Activity } from 'lucide-react';
import { NavTab, GameSession } from '../types';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface NavigationProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeSession: GameSession | null;
  showFloatingWidget: boolean;
  onToggleFloatingWidget: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  activeSession,
  showFloatingWidget,
  onToggleFloatingWidget,
}) => {
  const navItems: { tab: NavTab; label: string; icon: typeof Home }[] = [
    { tab: 'home', label: 'Home', icon: Home },
    { tab: 'dice', label: 'Dice', icon: Dices },
    { tab: 'players', label: 'Players', icon: Users },
    { tab: 'history', label: 'History', icon: History },
    { tab: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* DESKTOP HEADER */}
      <header className="hidden md:flex items-center justify-between gap-6 px-6 py-3.5 bg-[#0B1020]/90 border-b border-indigo-950/60 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Brand Wordmark */}
        <div 
          onClick={() => onSelectTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group select-none whitespace-nowrap shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0B1020] rounded-[10px] flex items-center justify-center text-lg">
              🎲
            </div>
          </div>
          <div>
            <h1 className="font-display font-extrabold text-base tracking-tight text-white leading-tight flex items-center gap-1.5">
              <span>LUDO COMPANION</span>
              <span className="text-[10px] text-purple-400 font-mono px-1.5 py-0.5 bg-purple-500/10 rounded-full border border-purple-500/20">
                PWA
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Independent Gaming Companion</p>
          </div>
        </div>

        {/* Zone 2: Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex items-center gap-1.5 p-1 bg-[#12182F] rounded-xl border border-indigo-950/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                aria-label={`Go to ${item.label}`}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Session Pill, Floating HUD toggle, & PWA Install */}
        <div className="flex items-center gap-2.5 shrink-0">
          <PWAInstallPrompt />

          {activeSession ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Session Active</span>
              <span className="text-emerald-400/60">·</span>
              <span className="font-mono">{activeSession.totalRolls} rolls</span>
            </div>
          ) : (
            <button
              onClick={() => onSelectTab('history')}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none"
            >
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>No Active Session</span>
            </button>
          )}

          <button
            onClick={onToggleFloatingWidget}
            title={showFloatingWidget ? 'Hide Floating Overlay' : 'Show Floating Overlay'}
            aria-label="Toggle floating HUD overlay"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
              showFloatingWidget
                ? 'bg-purple-950/50 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>{showFloatingWidget ? 'HUD Active' : 'Show HUD'}</span>
          </button>
        </div>
      </header>

      {/* MOBILE TOP COMPACT BAR */}
      <div className="md:hidden flex items-center justify-between px-4 py-2.5 bg-[#0B1020]/95 border-b border-indigo-950/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center text-sm shadow">
            🎲
          </div>
          <span className="font-display font-extrabold text-sm tracking-tight text-white">
            LUDO COMPANION
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallPrompt />

          {activeSession && (
            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
              {activeSession.totalRolls}r
            </span>
          )}
          <button
            onClick={onToggleFloatingWidget}
            aria-label="Toggle floating widget"
            className={`p-1.5 rounded-lg border text-xs focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:outline-none ${
              showFloatingWidget
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
            title="Toggle Floating Widget"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>


      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B1020]/95 border-t border-indigo-950/80 backdrop-blur-lg pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => onSelectTab(item.tab)}
                className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors ${
                  isActive ? 'text-purple-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${isActive ? 'bg-purple-500/15' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold mt-0.5 tracking-tight ${isActive ? 'text-purple-300' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};
