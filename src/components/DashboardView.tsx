import React from 'react';
import { 
  Play, 
  Dices, 
  Users, 
  Sparkles, 
  Flame, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  ChevronRight, 
  ArrowUpRight,
  TrendingUp
} from 'lucide-react';
import { Dice3D } from './Dice3D';
import { Player, DiceRoll, GameSession, NavTab } from '../types';

interface DashboardViewProps {
  activeSession: GameSession | null;
  onNavigate: (tab: NavTab) => void;
  players: Player[];
  activePlayer: Player;
  onSelectPlayer: (id: string) => void;
  onRoll: (playerId: string) => void;
  isRolling: boolean;
  lastRoll: DiceRoll | null;
  recentRolls: DiceRoll[];
  onStartSessionPrompt: () => void;
  onClearHistory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeSession,
  onNavigate,
  players,
  activePlayer,
  onSelectPlayer,
  onRoll,
  isRolling,
  lastRoll,
  recentRolls,
  onStartSessionPrompt,
  onClearHistory,
}) => {
  const totalRolls = recentRolls.length;
  const sixCount = recentRolls.filter((r) => r.value === 6).length;
  const sixPercentage = totalRolls > 0 ? ((sixCount / totalRolls) * 100).toFixed(1) : '0.0';

  // Format session duration if active
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* 1. HERO GAME SESSION BANNER */}
      {activeSession ? (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#16132D] via-[#1A2342] to-[#0C2338] border border-purple-500/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-emerald-300 tracking-wide uppercase">
                  Active Match in Progress
                </span>
              </div>
              <h2 className="text-base font-bold text-white mt-0.5">
                {activeSession.title}
              </h2>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Timer: <strong className="text-white font-mono">{formatTimer(activeSession.durationSeconds)}</strong></span>
                <span>·</span>
                <span>Rolls: <strong className="text-white font-mono">{activeSession.totalRolls}</strong></span>
                <span>·</span>
                <span>Sixes: <strong className="text-amber-400 font-mono">{activeSession.sixCount}</strong></span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('history')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-purple-600/30 hover:bg-purple-600/40 border border-purple-500/40 text-xs font-bold text-purple-200 transition-all active:scale-95 shrink-0"
          >
            <span>Manage Match</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#12182F] via-[#18203D] to-[#12182F] border border-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-purple-400 tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ready for Game Night?</span>
            </div>
            <h2 className="text-base font-bold text-white">
              Track Your Live Ludo Match
            </h2>
            <p className="text-xs text-slate-400 max-w-md">
              Start a session to record rolls, track 6s streaks, time your turns, and simulate opponent dice rolls.
            </p>
          </div>

          <button
            onClick={onStartSessionPrompt}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-600/30 active:scale-95 transition-all shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start New Match</span>
          </button>
        </div>
      )}

      {/* 2. MAIN DICE ROLLING CARD (HERO) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12182F]/90 border border-indigo-950/80 shadow-2xl relative overflow-hidden">
        {/* Ambient background aura */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Active Player Selector Strip */}
          <div className="w-full max-w-md mb-6">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Select Turn / Player:
            </div>
            <div className="grid grid-cols-4 gap-2 p-1.5 bg-[#0B1020] rounded-2xl border border-indigo-950/80">
              {players.map((p) => {
                const isSelected = p.id === activePlayer.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelectPlayer(p.id)}
                    className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-gradient-to-b from-purple-600 to-indigo-700 text-white shadow-md shadow-purple-600/30 scale-105'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate w-full text-center">{p.name}</span>
                    <span className="text-[10px] font-mono opacity-70 mt-0.5">
                      {p.lastRoll ? `#${p.lastRoll}` : '-'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3D Dice */}
          <div className="my-3 py-2">
            <Dice3D
              value={lastRoll?.value || 6}
              isRolling={isRolling}
              size="xl"
              colorTheme={activePlayer.color}
            />
          </div>

          {/* Result Banner */}
          <div className="h-10 flex items-center justify-center mt-2">
            {isRolling ? (
              <span className="text-sm font-bold text-purple-400 animate-pulse flex items-center gap-2">
                <Dices className="w-4 h-4 animate-spin" />
                <span>Simulating Cryptographic Roll...</span>
              </span>
            ) : lastRoll ? (
              <div className="text-center">
                <span className="text-base font-extrabold text-white">
                  {lastRoll.playerName} rolled{' '}
                  <span className="text-amber-400 text-lg font-mono underline decoration-amber-400/50">
                    #{lastRoll.value}
                  </span>
                </span>
                {lastRoll.value === 6 && (
                  <span className="ml-2 text-xs font-bold text-amber-300 bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    ★ EXTRA TURN!
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Tap button below to roll fair cryptographic dice
              </span>
            )}
          </div>

          {/* Large Action Button */}
          <div className="w-full max-w-sm mt-5 flex flex-col gap-2">
            <button
              onClick={() => onRoll(activePlayer.id)}
              disabled={isRolling}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 active:scale-95 text-white font-extrabold text-sm tracking-widest uppercase shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
            >
              <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
              <span>{isRolling ? 'Rolling...' : `Roll Dice (${activePlayer.name})`}</span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-1">
              <span>Fair Cryptographic RNG</span>
              <span>·</span>
              <span>100% Offline &amp; Private</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. RECENT ROLLS TRAY & QUICK METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Recent Rolls Strip (Left 7 cols) */}
        <div className="md:col-span-7 p-5 rounded-3xl bg-[#12182F] border border-indigo-950 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Recent Rolls Feed</h3>
            </div>
            <button
              onClick={() => onNavigate('dice')}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              <span>View Stats</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRolls.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No rolls recorded yet in this session. Roll the dice to start!
            </div>
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto py-2">
              {recentRolls
                .slice(-8)
                .reverse()
                .map((r) => (
                  <div
                    key={r.id}
                    className={`flex flex-col items-center justify-center min-w-[50px] p-2 rounded-2xl border transition-all ${
                      r.value === 6
                        ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-[#0B1020] border-indigo-950/80'
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 font-bold truncate max-w-[44px]">
                      {r.playerName}
                    </span>
                    <span className={`text-base font-mono font-extrabold my-0.5 ${r.value === 6 ? 'text-amber-400' : 'text-white'}`}>
                      {r.value}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(r.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Quick Stats Summary (Right 5 cols) */}
        <div className="md:col-span-5 p-5 rounded-3xl bg-[#12182F] border border-indigo-950 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">Quick Statistics</h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Total Rolls</span>
              <div className="text-xl font-extrabold font-mono text-white mt-0.5">
                {totalRolls}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Total 6s</span>
              <div className="text-xl font-extrabold font-mono text-amber-400 mt-0.5">
                {sixCount} <span className="text-xs font-normal text-amber-400/70">({sixPercentage}%)</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-indigo-950/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Expected 6s baseline:</span>
            <span className="font-mono text-slate-300 font-bold">16.7%</span>
          </div>
        </div>
      </div>

      {/* 4. PLAYER STANDINGS & INDEPENDENT SIMULATOR PREVIEW */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Players &amp; Opponents
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate opponent turns independently with separate dice histories
            </p>
          </div>

          <button
            onClick={() => onNavigate('players')}
            className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
          >
            <span>Manage Players</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {players.map((p) => {
            const isTurn = p.id === activePlayer.id;
            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isTurn
                    ? 'bg-gradient-to-b from-[#1C1736] to-[#12182F] border-purple-500/60 shadow-lg shadow-purple-500/10'
                    : 'bg-[#0B1020] border-indigo-950/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${
                      p.color === 'green' ? 'bg-emerald-400' :
                      p.color === 'red' ? 'bg-red-400' :
                      p.color === 'blue' ? 'bg-blue-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-xs font-bold text-white truncate max-w-[100px]">
                      {p.name}
                    </span>
                  </div>
                  {p.isHuman ? (
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      Human
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      Simulated
                    </span>
                  )}
                </div>

                <div className="my-2 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Latest Roll:</span>
                  <span className="text-sm font-mono font-extrabold text-amber-400">
                    {p.lastRoll ? `#${p.lastRoll}` : 'None'}
                  </span>
                </div>

                <button
                  onClick={() => onRoll(p.id)}
                  disabled={isRolling}
                  className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-200 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Dices className="w-3.5 h-3.5 text-purple-400" />
                  <span>Roll for {p.name}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
