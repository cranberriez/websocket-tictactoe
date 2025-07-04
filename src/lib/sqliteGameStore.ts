import Database from "better-sqlite3";
import { Game } from "@/types/game";

// Open or create the database file
const db = new Database("tictactoe.db");

// Create tables if they don't exist
// Games table: gameCode (PK), status, board (JSON), currentTurn, winner
// Players table: id (PK), gameCode (FK), name, role, wins

db.exec(`
CREATE TABLE IF NOT EXISTS games (
  gameCode TEXT PRIMARY KEY,
  status TEXT,
  board TEXT,
  currentTurn TEXT,
  winner TEXT
);

CREATE TABLE IF NOT EXISTS players (
  id TEXT,
  gameCode TEXT,
  name TEXT,
  role TEXT,
  wins INTEGER,
  symbol TEXT,
  PRIMARY KEY (id, gameCode),
  FOREIGN KEY (gameCode) REFERENCES games(gameCode)
);
`);

// Utility functions
export function saveGame(game: Game) {
	db.prepare(
		`INSERT OR REPLACE INTO games (gameCode, status, board, currentTurn, winner) VALUES (?, ?, ?, ?, ?)`
	).run(game.gameCode, game.status, JSON.stringify(game.board), game.currentTurn, game.winner);

	// Remove all players for this game and re-insert
	db.prepare(`DELETE FROM players WHERE gameCode = ?`).run(game.gameCode);
	const insertPlayer = db.prepare(
		`INSERT INTO players (id, gameCode, name, role, wins, symbol) VALUES (?, ?, ?, ?, ?, ?)`
	);
	for (const player of Object.values(game.players)) {
		insertPlayer.run(
			player.id,
			game.gameCode,
			player.name,
			player.role,
			player.wins,
			player.symbol
		);
	}
}

interface GameRow {
	gameCode: string;
	status: string;
	board: string;
	currentTurn: string | null;
	winner: string | null;
}

interface PlayerRow {
	id: string;
	gameCode: string;
	name: string;
	role: string;
	wins: number;
	symbol: string;
}

export function getGame(gameCode: string): Game | undefined {
	const gameRow = db.prepare(`SELECT * FROM games WHERE gameCode = ?`).get(gameCode) as
		| GameRow
		| undefined;
	if (!gameRow) return undefined;
	const playerRows = db
		.prepare(`SELECT * FROM players WHERE gameCode = ?`)
		.all(gameCode) as PlayerRow[];
	return {
		gameCode: gameRow.gameCode,
		status: gameRow.status as Game["status"],
		board: JSON.parse(gameRow.board),
		currentTurn: gameRow.currentTurn,
		winner: gameRow.winner,
		players: Object.fromEntries(
			playerRows.map((row: PlayerRow) => [
				row.id,
				{
					id: row.id,
					name: row.name,
					role: row.role,
					wins: row.wins,
					symbol: row.symbol,
				},
			])
		) as Game["players"],
	};
}

export function deleteGame(gameCode: string) {
	db.prepare(`DELETE FROM players WHERE gameCode = ?`).run(gameCode);
	db.prepare(`DELETE FROM games WHERE gameCode = ?`).run(gameCode);
}

export function getGames(): Game[] {
	const gameRows = db.prepare(`SELECT * FROM games`).all();
	return gameRows.map((gameRow: any) => {
		const playerRows = db
			.prepare(`SELECT * FROM players WHERE gameCode = ?`)
			.all(gameRow.gameCode);
		return {
			gameCode: gameRow.gameCode,
			status: gameRow.status,
			board: JSON.parse(gameRow.board),
			currentTurn: gameRow.currentTurn,
			winner: gameRow.winner,
			players: Object.fromEntries(
				playerRows.map((row: any) => [
					row.id,
					{
						id: row.id,
						name: row.name,
						role: row.role,
						wins: row.wins,
						symbol: row.symbol,
					},
				])
			),
		};
	});
}
