export interface Player {
  id: string;
  name: string;
  role: "host" | "guest";
  wins: number;
}

export interface Game {
  gameCode: string;
  players: Player[];
  status: "waiting" | "playing" | "finished";
  board: (string | null)[];
  currentTurn: string | null;
  winner: string | null;
}
