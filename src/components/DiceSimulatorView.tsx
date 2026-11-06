import React, { useState } from 'react';
import { 
  Dices, 
  RotateCcw, 
  BarChart2, 
  Flame, 
  Snowflake, 
  Sparkles,
  ShieldAlert,
  Info
} from 'lucide-react';
import { Dice3D } from './Dice3D';
import { Player, DiceRoll } from '../types';

interface DiceSimulatorViewProps {
  players: Player[];
  activePlayer: Player;
  onSelectPlayer: (id: string) => void;
  onRoll: (playerId: string) => void;
  isRolling: boolean;
  lastRoll: DiceRoll | null;
  rolls: DiceRoll[];
  onClearHistory: () => void;
}

export const DiceSimulatorView: React.FC<DiceSimulatorViewProps> = ({
  players,
  activePlayer,
  onSelectPlayer,
  onRoll,
  isRolling,
  lastRoll,
  rolls,
  onClearHistory,
}) => {
  const [filterPlayerId, setFilterPlayerId] = useState<string>('all');

  // Filter rolls if needed
  const displayRolls = rolls.filter(
    (r) => filterPlayerId === 'all' || r.playerId === filterPlayerId
  );

  // Calculate 1 to 6 frequencies
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  displayRolls.forEach((r) => {
    counts[r.value] = (counts[r.value] || 0) + 1;
  });

  const total = displayRolls.length;
  const sixCount = counts[6] || 0;
  const sixPercentage = total > 0 ? ((sixCount / total) * 100).toFixed(1) : '0.0';

  // Hot and cold number
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const hotNum = sorted.length > 0 && sorted[0][1] > 0 ? Number(sorted[0][0]) : null;
  const coldNum = sorted.length > 0 && total > 0 ? Number(sorted[sorted.length - 1][0]) : null;

  // Streak detection (e.g. how many sixes or same numbers in a row at the end)
  let streakValue = null;
  let streakCount = 0;
  if (displayRolls.length > 0) {
    const latest = displayRolls[displayRolls.length - 1].value;
    streakValue = latest;
    for (let i = displayRolls.length - 1; i >= 0; i--) {
      if (displayRolls[i].value === latest) {
        streakCount++;
      } else {
        break;
      }
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 rounded-3xl bg-[#12182F] border border-indigo-950">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Dices className="w-5 h-5 text-purple-400" />
            <span>Interactive Cryptographic Dice Simulator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically secure Web Crypto RNG (1–6) &middot; Independent &middot; Zero Bias
          </p>
        </div>

        {/* Clear Roll History Button */}
        <button
          onClick={onClearHistory}
          disabled={rolls.length === 0}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-xs font-semibold text-slate-300 border border-slate-700/80 transition-all disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Clear Rolls</span>
        </button>
      </div>

      {/* Main Dice Stage */}
      <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#16132D] via-[#12182F] to-[#0B1020] border border-purple-500/30 shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Glow lights */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Player Selector Bar */}
        <div className="relative z-10 w-full max-w-sm mb-6">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Rolling as:
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-[#0B1020] rounded-2xl border border-indigo-950/80 overflow-x-auto">
            {players.map((p) => {
              const isSelected = p.id === activePlayer.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectPlayer(p.id)}
                  className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold truncate transition-all ${
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
        </div>

        {/* Big 3D Dice Display */}
        <div className="relative z-10 my-4 py-2">
          <Dice3D
            value={lastRoll?.value || 6}
            isRolling={isRolling}
            size="xl"
            colorTheme={activePlayer.color}
            showGlow={true}
          />
        </div>

        {/* Result Indicator */}
        <div className="relative z-10 h-12 flex flex-col items-center justify-center mt-2">
          {isRolling ? (
            <div className="text-purple-400 font-extrabold text-sm animate-pulse flex items-center gap-2">
              <Dices className="w-4 h-4 animate-spin" />
              <span>Generating Secure Crypto Value...</span>
            </div>
          ) : lastRoll ? (
            <div className="flex flex-col items-center">
              <div className="text-xl font-extrabold text-white">
                Result: <span className="text-amber-400 text-2xl font-mono">#{lastRoll.value}</span>
              </div>
              {lastRoll.value === 6 && (
                <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-0.5 rounded-full border border-amber-400/40 mt-1 animate-bounce">
                  ★ SIX! Roll again or free a token!
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-400">Ready to roll</span>
          )}
        </div>

        {/* Roll Button */}
        <div className="relative z-10 w-full max-w-sm mt-6">
          <button
            onClick={() => onRoll(activePlayer.id)}
            disabled={isRolling}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 active:scale-95 text-white font-extrabold text-sm tracking-widest uppercase shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition-all disabled:opacity-50"
          >
            <Dices className={`w-5 h-5 ${isRolling ? 'animate-spin' : ''}`} />
            <span>{isRolling ? 'Rolling...' : `Roll for ${activePlayer.name}`}</span>
          </button>
        </div>
      </div>

      {/* Analytics Grid: Distribution Bar Chart & Hot/Cold Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Frequency Distribution (1-6) */}
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Number Distribution (1–6)</h3>
            </div>
            
            {/* Filter by player */}
            <div className="flex items-center gap-1 bg-[#0B1020] p-1 rounded-xl border border-indigo-950 text-xs">
              <button
                onClick={() => setFilterPlayerId('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterPlayerId === 'all'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setFilterPlayerId(p.id)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterPlayerId === p.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Dashed line represents theoretical fair baseline probability (<strong className="text-slate-200">16.67%</strong>).
          </p>

          {/* Bar Chart Container */}
          <div className="grid grid-cols-6 gap-2 sm:gap-4 pt-6 pb-2">
            {[1, 2, 3, 4, 5, 6].map((num) => {
              const count = counts[num] || 0;
              const pct = total > 0 ? (count / total) * 100 : 0;
              const maxCount = Math.max(...Object.values(counts), 1);
              const heightPercent = Math.min(100, Math.max(8, (count / maxCount) * 100));

              return (
                <div key={num} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-200 tabular-nums">
                    {count}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {pct.toFixed(0)}%
                  </span>

                  {/* Vertical bar */}
                  <div className="w-full h-36 bg-[#0B1020] rounded-2xl relative flex items-end p-1.5 border border-indigo-950/80">
                    {/* Theoretical baseline indicator at 16.7% */}
                    <div
                      style={{ bottom: '16.7%' }}
                      className="absolute left-0 right-0 border-b border-dashed border-slate-600/60 z-10 pointer-events-none"
                    />

                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-xl transition-all duration-300 ${
                        num === 6
                          ? 'bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                          : 'bg-gradient-to-t from-purple-700 via-indigo-600 to-cyan-400'
                      }`}
                    />
                  </div>

                  <div className="mt-1 flex flex-col items-center">
                    <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-white">
                      #{num}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side stats cards */}
        <div className="lg:col-span-4 space-y-4">
          {/* Hot & Cold stats */}
          <div className="p-5 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Pattern &amp; Streak Metrics
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Hot Number</span>
                </div>
                <div className="text-xl font-mono font-extrabold text-orange-300 mt-1">
                  {hotNum ? `#${hotNum}` : '-'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {hotNum ? `${counts[hotNum]} rolls` : 'No data'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950 flex flex-col">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                  <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Cold Number</span>
                </div>
                <div className="text-xl font-mono font-extrabold text-cyan-300 mt-1">
                  {coldNum ? `#${coldNum}` : '-'}
                </div>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  {coldNum ? `${counts[coldNum]} rolls` : 'No data'}
                </span>
              </div>
            </div>

            {/* Streak card */}
            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Current Run Streak:</span>
                <div className="text-sm font-bold text-white mt-0.5">
                  {streakValue ? (
                    <span>
                      {streakCount} &times; <strong className="text-amber-400">#{streakValue}</strong> in a row
                    </span>
                  ) : (
                    <span className="text-slate-500">None</span>
                  )}
                </div>
              </div>
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          {/* Tactical Ludo Distance Probability Card */}
          <div className="p-5 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Token Capture Odds Guide
              </h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target token at distance <strong className="text-slate-200">1 to 5</strong>: <span className="text-cyan-300 font-mono">16.7%</span> direct capture chance.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target at distance <strong className="text-slate-200">6</strong>: <span className="text-amber-300 font-mono">16.7%</span> direct, plus awards an extra turn!
            </p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target at distance <strong className="text-slate-200">7 to 12</strong>: Can be captured in 2 turns if a 6 is rolled first (<span className="text-purple-300 font-mono">~2.8% to 16.7%</span> combined probability).
            </p>
          </div>
        </div>
      </div>

      {/* Last 20 Rolls History Feed */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Last 20 Rolls Feed</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological log of recent simulated dice outcomes
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold">
            {displayRolls.slice(-20).length} recorded
          </span>
        </div>

        {displayRolls.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No dice rolls recorded yet. Roll using the button above!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {displayRolls
              .slice(-20)
              .reverse()
              .map((roll, idx) => (
                <div
                  key={roll.id}
                  className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                    roll.value === 6
                      ? 'bg-amber-950/40 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                      : 'bg-[#0B1020] border-indigo-950/80'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block truncate max-w-[70px]">
                      {roll.playerName}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className={`text-xl font-mono font-extrabold ${roll.value === 6 ? 'text-amber-400' : 'text-white'}`}>
                    #{roll.value}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
