import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Dices, 
  Play, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert,
  Edit2,
  Check
} from 'lucide-react';
import { Player, PlayerColor, DiceRoll } from '../types';
import { Dice3D } from './Dice3D';
import { sound } from '../utils/sound';

interface OpponentSimulatorViewProps {
  players: Player[];
  onAddOpponent: (name: string, color: PlayerColor) => void;
  onRemoveOpponent: (id: string) => void;
  onUpdatePlayerName: (id: string, newName: string) => void;
  onRoll: (playerId: string) => void;
  onSimulateFullRound: () => void;
  isRolling: boolean;
  rolls: DiceRoll[];
}

export const OpponentSimulatorView: React.FC<OpponentSimulatorViewProps> = ({
  players,
  onAddOpponent,
  onRemoveOpponent,
  onUpdatePlayerName,
  onRoll,
  onSimulateFullRound,
  isRolling,
  rolls,
}) => {
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newOpponentName, setNewOpponentName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<PlayerColor>('red');
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState<string>('');

  const colorsAvailable: PlayerColor[] = ['green', 'red', 'blue', 'yellow'];
  const canAddMore = players.length < 4;

  const handleCreateOpponent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpponentName.trim()) return;
    onAddOpponent(newOpponentName.trim(), selectedColor);
    setNewOpponentName('');
    setIsAdding(false);
  };

  const handleStartEdit = (p: Player) => {
    setEditingPlayerId(p.id);
    setEditNameText(p.name);
  };

  const handleSaveEdit = (p: Player) => {
    if (editNameText.trim()) {
      onUpdatePlayerName(p.id, editNameText.trim());
    }
    setEditingPlayerId(null);
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            <span>Simulated Opponents &amp; Player Standings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure up to 3 independent opponents with individual dice histories and simulated rolls
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canAddMore && !isAdding && (
            <button
              onClick={() => {
                sound.playClick();
                setIsAdding(true);
                // Auto pick first unused color
                const usedColors = players.map((p) => p.color);
                const unused = colorsAvailable.find((c) => !usedColors.includes(c)) || 'red';
                setSelectedColor(unused);
                setNewOpponentName(`Bot ${players.length}`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Opponent ({players.length}/4)</span>
            </button>
          )}

          <button
            onClick={() => onSimulateFullRound()}
            disabled={isRolling || players.length < 2}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#0B1020] hover:bg-slate-800 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all active:scale-95 disabled:opacity-40"
          >
            <Play className="w-4 h-4 fill-purple-400" />
            <span>Simulate Round (All)</span>
          </button>
        </div>
      </div>

      {/* Add Opponent Modal / Inline Card */}
      {isAdding && (
        <form
          onSubmit={handleCreateOpponent}
          className="p-5 rounded-3xl bg-gradient-to-r from-[#16132D] via-[#1A2342] to-[#12182F] border-2 border-purple-500/50 shadow-xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-purple-400" />
              <span>Create Simulated Opponent</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Opponent Name:
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={newOpponentName}
                onChange={(e) => setNewOpponentName(e.target.value)}
                placeholder="e.g., Alex, Alpha Bot"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-indigo-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-400 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Board Quadrant Color:
              </label>
              <div className="flex items-center gap-3">
                {colorsAvailable.map((c) => {
                  const isTaken = players.some((p) => p.color === c);
                  const isCurrent = selectedColor === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      disabled={isTaken}
                      onClick={() => setSelectedColor(c)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        isCurrent
                          ? 'border-purple-400 bg-purple-500/20 text-white shadow'
                          : isTaken
                          ? 'opacity-30 cursor-not-allowed border-transparent text-slate-500'
                          : 'border-indigo-950 bg-[#0B1020] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${
                        c === 'green' ? 'bg-emerald-400' :
                        c === 'red' ? 'bg-red-400' :
                        c === 'blue' ? 'bg-blue-400' : 'bg-yellow-400'
                      }`} />
                      <span className="capitalize">{c}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg active:scale-95 transition-all"
            >
              Save Opponent
            </button>
          </div>
        </form>
      )}

      {/* Players List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((p) => {
          const playerRolls = rolls.filter((r) => r.playerId === p.id);
          const totalRolls = playerRolls.length;
          const sixes = playerRolls.filter((r) => r.value === 6).length;
          const sixRate = totalRolls > 0 ? ((sixes / totalRolls) * 100).toFixed(0) : '0';
          const avg = totalRolls > 0 ? (playerRolls.reduce((a, b) => a + b.value, 0) / totalRolls).toFixed(1) : '-';

          const isEditing = editingPlayerId === p.id;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                p.isHuman
                  ? 'bg-gradient-to-br from-[#12182F] via-[#1A2342] to-[#12182F] border-purple-500/40 shadow-xl'
                  : 'bg-[#12182F] border-indigo-950 shadow-md'
              }`}
            >
              {/* Player Card Header */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-3.5 h-3.5 rounded-full shadow ${
                      p.color === 'green' ? 'bg-emerald-400 shadow-emerald-500/50' :
                      p.color === 'red' ? 'bg-red-400 shadow-red-500/50' :
                      p.color === 'blue' ? 'bg-blue-400 shadow-blue-500/50' : 'bg-yellow-400 shadow-yellow-500/50'
                    }`} />

                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          maxLength={15}
                          value={editNameText}
                          onChange={(e) => setEditNameText(e.target.value)}
                          className="px-2 py-1 rounded bg-[#0B1020] border border-purple-400 text-xs font-bold text-white focus:outline-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(p)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          {p.name}
                        </h3>
                        <button
                          onClick={() => handleStartEdit(p)}
                          className="text-slate-500 hover:text-slate-300"
                          title="Rename Player"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {p.isHuman ? (
                      <span className="text-[10px] font-extrabold text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full uppercase">
                        Human
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold text-purple-300 bg-purple-500/20 border border-purple-500/40 px-2 py-0.5 rounded-full uppercase">
                        Simulated
                      </span>
                    )}

                    {!p.isHuman && players.length > 2 && (
                      <button
                        onClick={() => onRemoveOpponent(p.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Remove Opponent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Latest Roll Spotlight */}
                <div className="my-4 p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Latest Roll Result</span>
                    <div className="text-base font-extrabold text-white mt-0.5">
                      {p.lastRoll ? (
                        <span>
                          Rolled <strong className="text-amber-400 font-mono text-lg">#{p.lastRoll}</strong>
                          {p.lastRoll === 6 && <span className="ml-1 text-amber-300">★ Extra Turn</span>}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs font-normal">Awaiting first roll</span>
                      )}
                    </div>
                  </div>

                  <div className="w-12 h-12 flex items-center justify-center">
                    <Dice3D
                      value={p.lastRoll || 6}
                      isRolling={false}
                      size="sm"
                      colorTheme={p.color}
                      showGlow={false}
                    />
                  </div>
                </div>

                {/* Player History Strip */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Recent Rolls:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {playerRolls.length === 0 ? (
                      <span className="text-[11px] text-slate-500 italic">No rolls yet</span>
                    ) : (
                      playerRolls.slice(-6).reverse().map((r, i) => (
                        <span
                          key={r.id}
                          className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                            r.value === 6
                              ? 'bg-amber-500/20 text-amber-400 border-amber-400/50'
                              : 'bg-[#0B1020] text-slate-300 border-indigo-950'
                          }`}
                        >
                          {r.value}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions and Stats Summary */}
              <div>
                <div className="pt-3 border-t border-indigo-950/80 grid grid-cols-3 gap-2 text-center text-xs text-slate-400 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Rolls</span>
                    <strong className="text-white font-mono">{totalRolls}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">6s Hit</span>
                    <strong className="text-amber-400 font-mono">{sixes} ({sixRate}%)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Avg Roll</span>
                    <strong className="text-cyan-300 font-mono">{avg}</strong>
                  </div>
                </div>

                <button
                  onClick={() => onRoll(p.id)}
                  disabled={isRolling}
                  className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold text-xs tracking-wider uppercase shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Dices className="w-3.5 h-3.5" />
                  <span>Roll for {p.name}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
