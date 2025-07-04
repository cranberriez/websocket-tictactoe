export interface Player {
  id: string;
  name: string;
  role: "host" | "guest";
  wins: number;
  symbol: "X" | "O";
}

export interface Game {
  gameCode: string;
  players: { [playerId: string]: Player };
  status: "waiting" | "playing" | "finished";
  board: (string | null)[];
  currentTurn: string | null;
  winner: string | null;
}
