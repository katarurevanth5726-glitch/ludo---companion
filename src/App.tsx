import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { DiceSimulatorView } from './components/DiceSimulatorView';
import { OpponentSimulatorView } from './components/OpponentSimulatorView';
import { SessionHistoryView } from './components/SessionHistoryView';
import { SettingsView } from './components/SettingsView';
import { FloatingWidget } from './components/FloatingWidget';
import { OfflineIndicator } from './components/OfflineIndicator';
import { 
  NavTab, 
  Player, 
  DiceRoll, 
  GameSession, 
  AppSettings, 
  PlayerColor 
} from './types';
import { storage } from './utils/storage';
import { generateCryptoRoll, triggerHaptic } from './utils/rng';
import { sound } from './utils/sound';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Application Settings
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());

  // Players
  const [players, setPlayers] = useState<Player[]>(() => storage.getPlayers());
  const [activePlayerId, setActivePlayerId] = useState<string>(() => players[0]?.id || 'player-1');

  // Rolls & Rolling state
  const [rolls, setRolls] = useState<DiceRoll[]>(() => storage.getRollHistory());
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(() => {
    const history = storage.getRollHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  });
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [isSimulatingRound, setIsSimulatingRound] = useState<boolean>(false);

  // Sessions
  const [activeSession, setActiveSession] = useState<GameSession | null>(() => storage.getActiveSession());
  const [pastSessions, setPastSessions] = useState<GameSession[]>(() => storage.getPastSessions());

  // Sync sound manager enabled state with settings
  useEffect(() => {
    sound.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Check reduced motion preference
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches && settings.animationsEnabled) {
        // Softly adapt if user prefers reduced motion
        handleUpdateSettings({ ...settings, animationsEnabled: false });
      }
    }
  }, []);

  // Save settings when changed
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.setSettings(newSettings);
  };

  // Active session live duration timer tick with proper cleanup
  useEffect(() => {
    if (!activeSession) return;
    const interval = setInterval(() => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const updated = {
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        };
        storage.setActiveSession(updated);
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.id]);

  // Active Player reference
  const activePlayer = players.find((p) => p.id === activePlayerId) || players[0];

  // Core Rolling Action - Guaranteed atomic and race-condition free
  const executeRoll = useCallback(
    (targetPlayerId: string): Promise<DiceRoll | null> => {
      return new Promise((resolve) => {
        const targetPlayer = players.find((p) => p.id === targetPlayerId) || players[0];
        setActivePlayerId(targetPlayer.id);
        setIsRolling(true);

        if (settings.soundEnabled) {
          sound.playDiceRoll();
        }

        const rollDuration = settings.animationsEnabled ? 350 : 100;

        setTimeout(() => {
          const rollValue = generateCryptoRoll();
          const isSix = rollValue === 6;

          triggerHaptic(isSix ? 'six' : 'roll', settings.hapticEnabled);
          if (isSix && settings.soundEnabled) {
            sound.playSixChime();
          }

          const newRoll: DiceRoll = {
            id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            value: rollValue,
            playerId: targetPlayer.id,
            playerName: targetPlayer.name,
            playerColor: targetPlayer.color,
            timestamp: Date.now(),
            isSix,
          };

          // Functional update for players
          setPlayers((prevPlayers) => {
            const updatedPlayers = prevPlayers.map((p) => {
              if (p.id === targetPlayer.id) {
                return {
                  ...p,
                  totalRolls: p.totalRolls + 1,
                  sixCount: isSix ? p.sixCount + 1 : p.sixCount,
                  lastRoll: rollValue,
                  history: [...p.history, rollValue].slice(-50),
                };
              }
              return p;
            });
            storage.setPlayers(updatedPlayers);
            return updatedPlayers;
          });

          // Functional update for rolls history
          setRolls((prevRolls) => {
            const updatedRolls = [...prevRolls, newRoll];
            storage.setRollHistory(updatedRolls);
            return updatedRolls;
          });

          setLastRoll(newRoll);

          // Functional update for active match session
          setActiveSession((prevSession) => {
            if (!prevSession) return null;
            const updatedSession: GameSession = {
              ...prevSession,
              totalRolls: prevSession.totalRolls + 1,
              sixCount: isSix ? prevSession.sixCount + 1 : prevSession.sixCount,
              rolls: [...prevSession.rolls, newRoll],
            };
            storage.setActiveSession(updatedSession);
            return updatedSession;
          });

          setIsRolling(false);
          resolve(newRoll);
        }, rollDuration);
      });
    },
    [players, settings]
  );

  const handleRoll = useCallback(
    (playerId: string) => {
      if (isRolling || isSimulatingRound) return;
      executeRoll(playerId);
    },
    [isRolling, isSimulatingRound, executeRoll]
  );

  // Simulate Full Round (roll sequentially for every player without overlapping or race conditions)
  const handleSimulateFullRound = useCallback(async () => {
    if (isRolling || isSimulatingRound || players.length < 2) return;
    setIsSimulatingRound(true);

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      await executeRoll(p.id);
      // Brief aesthetic turn pause before the next opponent rolls
      await new Promise((r) => setTimeout(r, 280));
    }

    setIsSimulatingRound(false);
  }, [players, executeRoll, isRolling, isSimulatingRound]);

  // Opponent management
  const handleAddOpponent = (name: string, color: PlayerColor) => {
    if (players.length >= 4) return;
    const newPlayer: Player = {
      id: `bot-${Date.now()}`,
      name,
      color,
      isHuman: false,
      totalRolls: 0,
      sixCount: 0,
      lastRoll: null,
      history: [],
    };
    setPlayers((prev) => {
      const updated = [...prev, newPlayer];
      storage.setPlayers(updated);
      return updated;
    });
  };

  const handleRemoveOpponent = (id: string) => {
    if (players.length <= 1) return;
    setPlayers((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      storage.setPlayers(updated);
      return updated;
    });
    if (activePlayerId === id) {
      setActivePlayerId(players[0]?.id || 'player-1');
    }
  };

  const handleUpdatePlayerName = (id: string, newName: string) => {
    setPlayers((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, name: newName } : p));
      storage.setPlayers(updated);
      return updated;
    });
  };

  // Session lifecycle
  const handleStartSession = (
    title: string,
    humanName: string,
    opponents: { name: string; color: PlayerColor }[]
  ) => {
    const newPlayers: Player[] = [
      {
        id: 'player-1',
        name: humanName,
        color: 'green',
        isHuman: true,
        totalRolls: 0,
        sixCount: 0,
        lastRoll: null,
        history: [],
      },
      ...opponents.map((o, idx) => ({
        id: `bot-${idx + 1}-${Date.now()}`,
        name: o.name,
        color: o.color,
        isHuman: false,
        totalRolls: 0,
        sixCount: 0,
        lastRoll: null,
        history: [],
      })),
    ];

    const newSession: GameSession = {
      id: `session-${Date.now()}`,
      title,
      startTime: Date.now(),
      durationSeconds: 0,
      players: newPlayers,
      totalRolls: 0,
      sixCount: 0,
      rolls: [],
      isCompleted: false,
    };

    setPlayers(newPlayers);
    storage.setPlayers(newPlayers);

    setActiveSession(newSession);
    storage.setActiveSession(newSession);

    setActivePlayerId('player-1');
  };

  const handleEndSession = (winnerId: string) => {
    if (!activeSession) return;
    const winner = activeSession.players.find((p) => p.id === winnerId) || activeSession.players[0];

    const completedSession: GameSession = {
      ...activeSession,
      endTime: Date.now(),
      isCompleted: true,
      winnerName: winner.name,
      winnerColor: winner.color,
    };

    setPastSessions((prev) => {
      const updated = [completedSession, ...prev];
      storage.setPastSessions(updated);
      return updated;
    });

    setActiveSession(null);
    storage.setActiveSession(null);
  };

  const handleDeletePastSession = (id: string) => {
    setPastSessions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      storage.setPastSessions(updated);
      return updated;
    });
  };

  // Reset all data
  const handleResetAllData = () => {
    storage.clearAllData();
    const defSettings = storage.getSettings();
    const defPlayers = storage.getPlayers();
    setSettings(defSettings);
    setPlayers(defPlayers);
    setActivePlayerId(defPlayers[0].id);
    setRolls([]);
    setLastRoll(null);
    setActiveSession(null);
    setPastSessions([]);
  };

  // Reload state after backup import
  const handleReloadFromStorage = () => {
    setSettings(storage.getSettings());
    const loadedPlayers = storage.getPlayers();
    setPlayers(loadedPlayers);
    setActivePlayerId(loadedPlayers[0]?.id || 'player-1');
    const loadedRolls = storage.getRollHistory();
    setRolls(loadedRolls);
    setLastRoll(loadedRolls.length > 0 ? loadedRolls[loadedRolls.length - 1] : null);
    setActiveSession(storage.getActiveSession());
    setPastSessions(storage.getPastSessions());
  };

  const handleClearRollHistory = () => {
    setRolls([]);
    setLastRoll(null);
    storage.setRollHistory([]);
    setPlayers((prev) => {
      const resetPlayers = prev.map((p) => ({
        ...p,
        totalRolls: 0,
        sixCount: 0,
        lastRoll: null,
        history: [],
      }));
      storage.setPlayers(resetPlayers);
      return resetPlayers;
    });
  };

  const totalCalculatedRolls = rolls.length;
  const sixesCalculated = rolls.filter((r) => r.value === 6).length;
  const rollBusy = isRolling || isSimulatingRound;

  return (
    <div className="min-h-screen bg-[#0B1020] text-slate-100 flex flex-col font-sans selection:bg-purple-500/30 selection:text-purple-200">
      {/* Top Desktop / Mobile Header & Navigation */}
      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activeSession={activeSession}
        showFloatingWidget={settings.showFloatingWidget}
        onToggleFloatingWidget={() => {
          handleUpdateSettings({
            ...settings,
            showFloatingWidget: !settings.showFloatingWidget,
          });
        }}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'home' && (
          <DashboardView
            activeSession={activeSession}
            onNavigate={setActiveTab}
            players={players}
            activePlayer={activePlayer}
            onSelectPlayer={setActivePlayerId}
            onRoll={handleRoll}
            isRolling={rollBusy}
            lastRoll={lastRoll}
            recentRolls={rolls}
            onStartSessionPrompt={() => setActiveTab('history')}
            onClearHistory={handleClearRollHistory}
          />
        )}

        {activeTab === 'dice' && (
          <DiceSimulatorView
            players={players}
            activePlayer={activePlayer}
            onSelectPlayer={setActivePlayerId}
            onRoll={handleRoll}
            isRolling={rollBusy}
            lastRoll={lastRoll}
            rolls={rolls}
            onClearHistory={handleClearRollHistory}
          />
        )}

        {activeTab === 'players' && (
          <OpponentSimulatorView
            players={players}
            onAddOpponent={handleAddOpponent}
            onRemoveOpponent={handleRemoveOpponent}
            onUpdatePlayerName={handleUpdatePlayerName}
            onRoll={handleRoll}
            onSimulateFullRound={handleSimulateFullRound}
            isRolling={rollBusy}
            rolls={rolls}
          />
        )}

        {activeTab === 'history' && (
          <SessionHistoryView
            activeSession={activeSession}
            pastSessions={pastSessions}
            onStartSession={handleStartSession}
            onEndSession={handleEndSession}
            onDeleteSession={handleDeletePastSession}
            allRolls={rolls}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onResetAllData={handleResetAllData}
            onReloadFromStorage={handleReloadFromStorage}
          />
        )}
      </main>

      {/* In-Page Draggable Floating Companion HUD */}
      {settings.showFloatingWidget && (
        <FloatingWidget
          isOpen={settings.showFloatingWidget}
          onClose={() => {
            handleUpdateSettings({
              ...settings,
              showFloatingWidget: false,
            });
          }}
          players={players}
          activePlayerId={activePlayerId}
          onSelectPlayer={setActivePlayerId}
          onRoll={handleRoll}
          isRolling={rollBusy}
          lastRoll={lastRoll}
          totalRolls={totalCalculatedRolls}
          sixCount={sixesCalculated}
        />
      )}

      {/* Offline Status Toast Indicator */}
      <OfflineIndicator />

      {/* Footer */}
      <footer className="mt-auto px-6 py-4 border-t border-indigo-950/60 text-xs text-slate-500 hidden md:flex items-center justify-between">
        <div>
          <span>LUDO COMPANION &middot; Independent Tabletop Dice &amp; Match Tracker</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PWA Standalone Ready</span>
          <span>·</span>
          <span>Web Crypto Cryptographic RNG</span>
          <span>·</span>
          <span>100% Offline LocalStorage</span>
        </div>
      </footer>
    </div>
  );
}
