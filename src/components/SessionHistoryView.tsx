import React, { useState } from 'react';
import { 
  History, 
  Play, 
  Square, 
  Trophy, 
  Clock, 
  Trash2, 
  Download, 
  Check, 
  Sparkles,
  Calendar,
  Layers,
  ChevronRight
} from 'lucide-react';
import { GameSession, Player, PlayerColor, DiceRoll } from '../types';
import { sound } from '../utils/sound';

interface SessionHistoryViewProps {
  activeSession: GameSession | null;
  pastSessions: GameSession[];
  onStartSession: (title: string, playerName: string, opponents: { name: string; color: PlayerColor }[]) => void;
  onEndSession: (winnerId: string) => void;
  onDeleteSession: (id: string) => void;
  allRolls: DiceRoll[];
}

export const SessionHistoryView: React.FC<SessionHistoryViewProps> = ({
  activeSession,
  pastSessions,
  onStartSession,
  onEndSession,
  onDeleteSession,
  allRolls,
}) => {
  const [isStartingNew, setIsStartingNew] = useState<boolean>(false);
  const [sessionTitle, setSessionTitle] = useState<string>('Classic Ludo Match');
  const [playerName, setPlayerName] = useState<string>('You');
  const [opponent1, setOpponent1] = useState<string>('Bot 1');
  const [opponent2, setOpponent2] = useState<string>('Bot 2');
  const [opponent3, setOpponent3] = useState<string>('Bot 3');

  const [endingModalOpen, setEndingModalOpen] = useState<boolean>(false);
  const [selectedWinnerId, setSelectedWinnerId] = useState<string>('');

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleStartSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const opponents: { name: string; color: PlayerColor }[] = [
      { name: opponent1.trim() || 'Bot 1', color: 'red' },
      { name: opponent2.trim() || 'Bot 2', color: 'blue' },
      { name: opponent3.trim() || 'Bot 3', color: 'yellow' },
    ];
    onStartSession(sessionTitle.trim() || 'Ludo Match', playerName.trim() || 'You', opponents);
    setIsStartingNew(false);
  };

  const handleOpenEndModal = () => {
    if (!activeSession) return;
    setSelectedWinnerId(activeSession.players[0].id);
    setEndingModalOpen(true);
  };

  const handleConfirmEnd = () => {
    onEndSession(selectedWinnerId);
    setEndingModalOpen(false);
  };

  const exportAllCSV = () => {
    if (allRolls.length === 0) return;
    const header = 'ID,Player,Color,Value,IsSix,Timestamp,Time\n';
    const rows = allRolls
      .map(
        (r) =>
          `"${r.id}","${(r.playerName || '').replace(/"/g, '""')}","${r.playerColor}",${r.value},${r.isSix},${r.timestamp},"${new Date(
            r.timestamp
          ).toISOString()}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ludo-companion-rolls-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };


  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950">
        <div>
          <h2 className="text-base font-extrabold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-purple-400" />
            <span>Game Session Tracker &amp; Match Archives</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persist your game nights, track turn duration, celebrate winners, and review historical roll statistics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!activeSession && !isStartingNew && (
            <button
              onClick={() => {
                sound.playClick();
                setIsStartingNew(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Match</span>
            </button>
          )}

          <button
            onClick={exportAllCSV}
            disabled={allRolls.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700/80 transition-all disabled:opacity-40"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5 text-purple-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* START NEW SESSION FORM MODAL / CARD */}
      {isStartingNew && (
        <form
          onSubmit={handleStartSubmit}
          className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#16132D] via-[#1A2342] to-[#12182F] border-2 border-purple-500/50 shadow-2xl space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Setup New Game Session</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsStartingNew(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Session Name / Table:
              </label>
              <input
                type="text"
                required
                maxLength={25}
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. Friday Night Ludo #1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-indigo-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Your Player Name (Green):
              </label>
              <input
                type="text"
                required
                maxLength={15}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-indigo-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Opponent 1 (Red):
              </label>
              <input
                type="text"
                maxLength={15}
                value={opponent1}
                onChange={(e) => setOpponent1(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-indigo-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Opponent 2 (Blue):
              </label>
              <input
                type="text"
                maxLength={15}
                value={opponent2}
                onChange={(e) => setOpponent2(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B1020] border border-indigo-950 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-purple-400"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsStartingNew(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-xs font-bold text-white shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              Start Tracking Match
            </button>
          </div>
        </form>
      )}

      {/* ACTIVE LIVE MATCH CARD */}
      {activeSession && (
        <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-[#12182F] via-[#18203D] to-[#12182F] border-2 border-emerald-500/40 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Live Match Tracking
                </span>
                <h3 className="text-base font-bold text-white">{activeSession.title}</h3>
              </div>
            </div>

            <button
              onClick={handleOpenEndModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-red-950/50 hover:bg-red-900/60 border border-red-500/50 text-xs font-bold text-red-300 transition-all active:scale-95"
            >
              <Square className="w-3.5 h-3.5 fill-red-400" />
              <span>Finish &amp; Record Match</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Elapsed Time</span>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {formatDuration(activeSession.durationSeconds)}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Total Rolls</span>
              <div className="text-lg font-mono font-bold text-white mt-0.5">
                {activeSession.totalRolls}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Total 6s Hit</span>
              <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
                {activeSession.sixCount}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0B1020] border border-indigo-950">
              <span className="text-[11px] text-slate-400">Active Players</span>
              <div className="text-lg font-mono font-bold text-purple-300 mt-0.5">
                {activeSession.players.length} Players
              </div>
            </div>
          </div>
        </div>
      )}

      {/* END SESSION WINNER SELECTION MODAL */}
      {endingModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#12182F] border-2 border-purple-500/60 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Select Game Winner</h3>
            </div>

            <p className="text-xs text-slate-400">
              Who reached all four tokens home first?
            </p>

            <div className="grid grid-cols-2 gap-2.5 my-3">
              {activeSession.players.map((p) => {
                const isSelected = selectedWinnerId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedWinnerId(p.id)}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all text-left ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-lg'
                        : 'border-indigo-950 bg-[#0B1020] text-slate-300 hover:text-white'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${
                      p.color === 'green' ? 'bg-emerald-400' :
                      p.color === 'red' ? 'bg-red-400' :
                      p.color === 'blue' ? 'bg-blue-400' : 'bg-yellow-400'
                    }`} />
                    <span className="text-xs font-bold truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEndingModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmEnd}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-xs font-bold text-slate-950 shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Save Match Result</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREVIOUS SAVED SESSIONS LIST */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#12182F] border border-indigo-950 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Previous Saved Matches</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical match archive with winner and roll metrics
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 font-bold">
            {pastSessions.length} Matches
          </span>
        </div>

        {pastSessions.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No completed matches in archive yet. Start and complete a session to view here!
          </div>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session) => (
              <div
                key={session.id}
                className="p-4 rounded-2xl bg-[#0B1020] border border-indigo-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-indigo-900 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(session.startTime).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDuration(session.durationSeconds)}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{session.title}</h4>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                    {session.winnerName && (
                      <span className="text-amber-400 font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        <span>Winner: {session.winnerName}</span>
                      </span>
                    )}
                    <span>Total Rolls: <strong className="text-slate-200">{session.totalRolls}</strong></span>
                    <span>Total 6s: <strong className="text-amber-400">{session.sixCount}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => onDeleteSession(session.id)}
                    className="p-2 rounded-xl text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
