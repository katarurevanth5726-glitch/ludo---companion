import { AppSettings, GameSession, Player, DiceRoll } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'ludo_companion_settings_v2',
  PLAYERS: 'ludo_companion_players_v2',
  ACTIVE_SESSION: 'ludo_companion_active_session_v2',
  PAST_SESSIONS: 'ludo_companion_past_sessions_v2',
  ROLLS_HISTORY: 'ludo_companion_rolls_history_v2',
};

export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  hapticEnabled: true,
  animationsEnabled: true,
  showFloatingWidget: true,
  accentColor: 'purple',
};

export const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'player-1',
    name: 'You',
    color: 'green',
    isHuman: true,
    totalRolls: 0,
    sixCount: 0,
    lastRoll: null,
    history: [],
  },
  {
    id: 'player-2',
    name: 'Bot 1',
    color: 'red',
    isHuman: false,
    totalRolls: 0,
    sixCount: 0,
    lastRoll: null,
    history: [],
  },
  {
    id: 'player-3',
    name: 'Bot 2',
    color: 'blue',
    isHuman: false,
    totalRolls: 0,
    sixCount: 0,
    lastRoll: null,
    history: [],
  },
  {
    id: 'player-4',
    name: 'Bot 3',
    color: 'yellow',
    isHuman: false,
    totalRolls: 0,
    sixCount: 0,
    lastRoll: null,
    history: [],
  },
];

export const storage = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  setSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn('Storage write error', e);
    }
  },

  getPlayers(): Player[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      return data ? JSON.parse(data) : DEFAULT_PLAYERS;
    } catch {
      return DEFAULT_PLAYERS;
    }
  },

  setPlayers(players: Player[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
    } catch (e) {
      console.warn('Storage write error', e);
    }
  },

  getActiveSession(): GameSession | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setActiveSession(session: GameSession | null) {
    try {
      if (session) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      }
    } catch (e) {
      console.warn('Storage write error', e);
    }
  },

  getPastSessions(): GameSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAST_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setPastSessions(sessions: GameSession[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.PAST_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage write error', e);
    }
  },

  getRollHistory(): DiceRoll[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ROLLS_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setRollHistory(rolls: DiceRoll[]) {
    try {
      // Store maximum latest 100 rolls in persistent general log
      localStorage.setItem(STORAGE_KEYS.ROLLS_HISTORY, JSON.stringify(rolls.slice(-100)));
    } catch (e) {
      console.warn('Storage write error', e);
    }
  },

  clearAllData() {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.PLAYERS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
      localStorage.removeItem(STORAGE_KEYS.PAST_SESSIONS);
      localStorage.removeItem(STORAGE_KEYS.ROLLS_HISTORY);
    } catch (e) {
      console.warn('Storage clear error', e);
    }
  },

  exportBackup(): string {
    const backup = {
      app: 'LUDO_COMPANION',
      version: '2.0.0',
      exportedAt: Date.now(),
      settings: this.getSettings(),
      players: this.getPlayers(),
      activeSession: this.getActiveSession(),
      pastSessions: this.getPastSessions(),
      rollsHistory: this.getRollHistory(),
    };
    return JSON.stringify(backup, null, 2);
  },

  validateBackup(parsed: any): { 
    valid: boolean; 
    error?: string; 
    stats?: { playersCount: number; pastSessionsCount: number; rollsCount: number } 
  } {
    if (!parsed || typeof parsed !== 'object') {
      return { valid: false, error: 'Backup file does not contain a valid JSON object.' };
    }

    if (!Array.isArray(parsed.players) || parsed.players.length === 0) {
      return { valid: false, error: 'Missing or invalid players list in backup data.' };
    }

    // Check player schema
    for (const p of parsed.players) {
      if (!p.id || typeof p.name !== 'string' || !p.color) {
        return { valid: false, error: `Invalid player record in backup: ${p?.name || 'unknown'}.` };
      }
    }

    if (!Array.isArray(parsed.pastSessions)) {
      return { valid: false, error: 'Invalid past sessions format in backup data.' };
    }

    if (!Array.isArray(parsed.rollsHistory)) {
      return { valid: false, error: 'Invalid dice roll history format in backup data.' };
    }

    return {
      valid: true,
      stats: {
        playersCount: parsed.players.length,
        pastSessionsCount: parsed.pastSessions.length,
        rollsCount: parsed.rollsHistory.length,
      },
    };
  },

  importBackup(parsed: any) {
    if (parsed.settings) this.setSettings(parsed.settings);
    if (parsed.players) this.setPlayers(parsed.players);
    if ('activeSession' in parsed) this.setActiveSession(parsed.activeSession);
    if (parsed.pastSessions) this.setPastSessions(parsed.pastSessions);
    if (parsed.rollsHistory) this.setRollHistory(parsed.rollsHistory);
  },
};

