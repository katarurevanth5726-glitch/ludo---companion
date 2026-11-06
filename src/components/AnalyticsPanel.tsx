import React, { useState } from 'react';
import { 
  BarChart3, 
  RotateCcw, 
  Download, 
  Filter, 
  Flame, 
  Snowflake,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { DiceRollItem, RollSource } from '../types';
import { DiceFace } from './DiceFace';

interface AnalyticsPanelProps {
  rolls: DiceRollItem[];
  onResetRolls: () => void;
  onSimulateBatch?: (count: number) => void;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({
  rolls,
  onResetRolls,
}) => {
  const [filterSource, setFilterSource] = useState<'all' | RollSource>('all');

  // Distribution calculations
  const total = rolls.length;
  const filteredRolls = rolls.filter(
    (r) => filterSource === 'all' || r.source === filterSource
  );

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  let playerCount = 0;
  let opponentCount = 0;

  rolls.forEach((r) => {
    counts[r.value] = (counts[r.value] || 0) + 1;
    if (r.source === 'player') playerCount++;
    else opponentCount++;
  });

  const sixCount = counts[6] || 0;
  const sixPercent = total > 0 ? ((sixCount / total) * 100).toFixed(1) : '0.0';

  // Find Hot (most frequent) and Cold (least frequent) numbers
  const sortedByFreq = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const hotNumber = sortedByFreq.length > 0 ? Number(sortedByFreq[0][0]) : null;
  const coldNumber = sortedByFreq.length > 0 ? Number(sortedByFreq[sortedByFreq.length - 1][0]) : null;

  // Export to CSV
  const exportCSV = () => {
    if (rolls.length === 0) return;
    const header = 'ID,Value,Source,Timestamp,Time\n';
    const rows = rolls
      .map(
        (r) =>
          `"${r.id}",${r.value},"${r.source}",${r.timestamp},"${new Date(
            r.timestamp
          ).toISOString()}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ludo-rolls-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Total Rolls</div>
          <div className="text-2xl font-bold font-mono text-white mt-1 tabular-nums">
            {total}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {playerCount} Player · {opponentCount} Opponent
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Number 6 Frequency</div>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {sixCount} <span className="text-sm font-normal text-amber-400/70">({sixPercent}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Theoretical: 16.7%
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>Hot Number</span>
          </div>
          <div className="text-2xl font-bold font-mono text-orange-300 mt-1 flex items-center gap-2">
            {hotNumber && counts[hotNumber] > 0 ? (
              <>
                <span>#{hotNumber}</span>
                <span className="text-xs font-normal text-slate-400">({counts[hotNumber]} rolls)</span>
              </>
            ) : (
              <span className="text-slate-500 text-lg">None</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Most common roll</div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
            <span>Cold Number</span>
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300 mt-1 flex items-center gap-2">
            {coldNumber && total > 0 ? (
              <>
                <span>#{coldNumber}</span>
                <span className="text-xs font-normal text-slate-400">({counts[coldNumber]} rolls)</span>
              </>
            ) : (
              <span className="text-slate-500 text-lg">None</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Least common roll</div>
        </div>
      </div>

      {/* Frequency Distribution Chart */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Frequency Distribution (1–6)</h3>
          </div>
          <span className="text-xs text-slate-400">
            Dotted line = Fair Expected Rate (16.7%)
          </span>
        </div>

        <div className="grid grid-cols-6 gap-3 pt-6 pb-2">
          {[1, 2, 3, 4, 5, 6].map((num) => {
            const count = counts[num] || 0;
            const pct = total > 0 ? (count / total) * 100 : 0;
            const maxVal = Math.max(...Object.values(counts), 1);
            const heightPercent = Math.min(100, Math.max(8, (count / maxVal) * 100));

            return (
              <div key={num} className="flex flex-col items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                  {count} <span className="text-[10px] text-slate-500">({pct.toFixed(0)}%)</span>
                </span>
                
                {/* Bar */}
                <div className="w-full h-32 bg-slate-950/80 rounded-xl relative flex items-end p-1.5 border border-slate-800">
                  {/* Expected 16.7% line reference */}
                  <div 
                    style={{ bottom: '16.7%' }} 
                    className="absolute left-0 right-0 border-b border-dashed border-slate-600/60 z-10 pointer-events-none" 
                  />

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-lg transition-all duration-300 ${
                      num === 6
                        ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                        : 'bg-gradient-to-t from-slate-700 to-slate-500'
                    }`}
                  />
                </div>

                <div className="mt-1 flex flex-col items-center">
                  <DiceFace value={num} size="sm" isSelected={num === 6} />
                  <span className="text-xs font-bold text-slate-300 mt-1">#{num}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ludo Token Tactical Capture Odds Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Ludo Tactical Odds & Capture Matrix</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          In Ludo, rolling a <strong>6</strong> awards an immediate consecutive turn. Use this mathematical companion matrix to evaluate whether your token is safe or in the opponent’s strike zone.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2 font-medium">Distance (Squares)</th>
                <th className="pb-2 font-medium">Single Turn Hit Chance</th>
                <th className="pb-2 font-medium">2-Turn Strike Threat (with 6 re-roll)</th>
                <th className="pb-2 font-medium">Recommended Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-bold text-amber-400">1–5 Squares</td>
                <td className="py-2.5 font-mono">16.7% (1 in 6)</td>
                <td className="py-2.5 font-mono text-amber-300">~19.4%</td>
                <td className="py-2.5 text-slate-400">Advance to safe star square or block path</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-400">6 Squares</td>
                <td className="py-2.5 font-mono font-bold text-red-400">16.7% (Direct 6)</td>
                <td className="py-2.5 font-mono text-red-300">High Threat (Opponent gets free roll)</td>
                <td className="py-2.5 text-slate-400">Critical danger! Move token off this mark</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-400">7–12 Squares</td>
                <td className="py-2.5 font-mono">0.0% (Single turn)</td>
                <td className="py-2.5 font-mono text-yellow-300">~2.8% to 16.7% (6 + sub-roll)</td>
                <td className="py-2.5 text-slate-400">Moderately safe; prioritize forward progression</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Roll History Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Simulation History Feed</h3>
            <span className="text-xs text-slate-400">({filteredRolls.length} entries)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter buttons */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setFilterSource('all')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterSource === 'all'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterSource('player')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterSource === 'player'
                    ? 'bg-amber-500/20 text-amber-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setFilterSource('opponent')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  filterSource === 'opponent'
                    ? 'bg-cyan-500/20 text-cyan-300 font-medium'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Opponent
              </button>
            </div>

            <button
              onClick={exportCSV}
              disabled={rolls.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors disabled:opacity-40"
              title="Export as CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onResetRolls}
              disabled={rolls.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/50 text-slate-300 hover:text-red-300 transition-colors disabled:opacity-40"
              title="Reset history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filteredRolls.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No simulation rolls recorded yet. Roll using the floating overlay!
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-800/60 pr-1">
            {filteredRolls
              .slice()
              .reverse()
              .map((roll, idx) => (
                <div
                  key={roll.id}
                  className="py-2.5 flex items-center justify-between text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-mono text-[11px] w-6">
                      #{filteredRolls.length - idx}
                    </span>
                    <DiceFace
                      value={roll.value}
                      size="sm"
                      variant={roll.source === 'player' ? 'gold' : 'cyan'}
                      isSelected={roll.value === 6}
                    />
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>Rolled {roll.value}</span>
                        {roll.value === 6 && (
                          <span className="text-[10px] text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded font-mono">
                            ★ SIX
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {roll.source === 'player' ? (
                          <span className="text-amber-400/90 font-medium">Player Selected</span>
                        ) : (
                          <span className="text-cyan-400/90 font-medium">Opponent RNG</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="font-mono text-[11px] text-slate-400">
                    {new Date(roll.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
