export type PlayerSymbol = "X" | "O";
export type PlayerRole = "host" | "guest";

export interface Player {
  id: string;
  symbol: PlayerSymbol;
  role: PlayerRole;
  isYou: boolean;
}

export interface GameState {
  id: string;
  squares: Array<string | null>;
  nextPlayer: PlayerSymbol;
  winner: string | null;
  winningLine: number[];
  players: Player[];
  hasStarted: boolean;
  isComplete: boolean;
}

export interface GameAction {
  type: string;
  payload?: any;
}

export type GameEventType = 
  | "game-move" 
  | "game-join" 
  | "game-start" 
  | "game-reset" 
  | "game-end" 
  | "player-join" 
  | "player-leave";

export interface GameEvent {
  gameId: string;
  event: GameEventType;
  squares?: Array<string | null>;
  nextPlayer?: PlayerSymbol;
  playerId?: string;
  playerRole?: PlayerRole;
  playerSymbol?: PlayerSymbol;
  winner?: string | null;
}
