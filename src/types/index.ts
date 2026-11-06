export type PlayerColor = 'green' | 'red' | 'blue' | 'yellow';

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  isHuman: boolean;
  totalRolls: number;
  sixCount: number;
  lastRoll: number | null;
  history: number[];
}

export interface DiceRoll {
  id: string;
  value: number; // 1 to 6
  playerId: string;
  playerName: string;
  playerColor: PlayerColor;
  timestamp: number;
  isSix: boolean;
}

export interface GameSession {
  id: string;
  title: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  players: Player[];
  totalRolls: number;
  sixCount: number;
  winnerName?: string;
  winnerColor?: PlayerColor;
  rolls: DiceRoll[];
  isCompleted: boolean;
}

export interface AppSettings {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  animationsEnabled: boolean;
  showFloatingWidget: boolean;
  accentColor: 'purple' | 'cyan' | 'emerald';
}

export type NavTab = 'home' | 'dice' | 'players' | 'history' | 'settings';

export type RollSource = 'player' | 'opponent';

export interface DiceRollItem {
  id: string;
  value: number;
  source: RollSource;
  timestamp: number;
}

export interface SimulationStats {
  totalRolls: number;
  playerRolls: number;
  opponentRolls: number;
  distribution: Record<number, number>;
  sixCount: number;
  sixPercentage: number;
  lastRoll: DiceRollItem | null;
  currentStreak: { value: number; count: number; } | null;
}

export type PhoneBackground = 'ludo-board' | 'ludo-match' | 'home-screen';
