import { createClient, Client } from "@libsql/client";
import { Game } from "@/types/game";

const tursoUrl = process.env.TURSO_DATABASE_URL!;
const tursoAuthToken = process.env.TURSO_AUTH_TOKEN!;

const client: Client = createClient({
	url: tursoUrl,
	authToken: tursoAuthToken,
});

// --- Turso DB schema initialization ---
async function initTursoSchema() {
	await client.execute(`
		CREATE TABLE IF NOT EXISTS games (
			gameCode TEXT PRIMARY KEY,
			status TEXT,
			board TEXT,
			currentTurn TEXT,
			winner TEXT
		);
	`);
	await client.execute(`
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
}

// --- Helper to catch 'no such table' errors and retry after initializing schema ---
async function withTursoSchemaRetry<T>(fn: () => Promise<T>): Promise<T> {
	try {
		return await fn();
	} catch (e: any) {
		if (e?.code === "SQLITE_UNKNOWN" && /no such table/.test(e.message)) {
			await initTursoSchema();
			return await fn();
		}
		throw e;
	}
}

// Utility functions for Turso DB (libsql)
export async function saveGame(game: Game) {
	await client.execute(
		`INSERT OR REPLACE INTO games (gameCode, status, board, currentTurn, winner) VALUES (?, ?, ?, ?, ?)`,
		[game.gameCode, game.status, JSON.stringify(game.board), game.currentTurn, game.winner]
	);

	// Remove all players for this game and re-insert
	await client.execute(`DELETE FROM players WHERE gameCode = ?`, [game.gameCode]);
	for (const player of Object.values(game.players)) {
		await client.execute(
			`INSERT INTO players (id, gameCode, name, role, wins, symbol) VALUES (?, ?, ?, ?, ?, ?)`,
			[player.id, game.gameCode, player.name, player.role, player.wins, player.symbol]
		);
	}
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	return withTursoSchemaRetry(async () => {
		const gameRes = await client.execute(`SELECT * FROM games WHERE gameCode = ?`, [gameCode]);
		if (gameRes.rows.length === 0) return undefined;
		const gameRow = gameRes.rows[0];

		const playersRes = await client.execute(`SELECT * FROM players WHERE gameCode = ?`, [
			gameCode,
		]);
		const players: Record<string, any> = {};
		for (const row of playersRes.rows) {
			// Only use string id keys
			const id = typeof row.id === "string" ? row.id : String(row.id);
			players[id] = {
				id,
				name: typeof row.name === "string" ? row.name : String(row.name ?? ""),
				role: typeof row.role === "string" ? row.role : String(row.role ?? ""),
				wins: typeof row.wins === "number" ? row.wins : Number(row.wins ?? 0),
				symbol: typeof row.symbol === "string" ? row.symbol : String(row.symbol ?? ""),
			};
		}

		return {
			gameCode:
				typeof gameRow.gameCode === "string"
					? gameRow.gameCode
					: String(gameRow.gameCode ?? ""),
			status:
				typeof gameRow.status === "string" ? (gameRow.status as Game["status"]) : "waiting",
			board: typeof gameRow.board === "string" ? JSON.parse(gameRow.board) : [],
			currentTurn: typeof gameRow.currentTurn === "string" ? gameRow.currentTurn : null,
			winner: typeof gameRow.winner === "string" ? gameRow.winner : null,
			players,
		};
	});
}

export async function deleteGame(gameCode: string) {
	return withTursoSchemaRetry(async () => {
		await client.execute(`DELETE FROM games WHERE gameCode = ?`, [gameCode]);
		await client.execute(`DELETE FROM players WHERE gameCode = ?`, [gameCode]);
	});
}

export async function getGames(): Promise<Game[]> {
	return withTursoSchemaRetry(async () => {
		const gamesRes = await client.execute(`SELECT * FROM games`, []);
		const games: Game[] = [];
		for (const gameRow of gamesRes.rows) {
			const playersRes = await client.execute(`SELECT * FROM players WHERE gameCode = ?`, [
				typeof gameRow.gameCode === "string"
					? gameRow.gameCode
					: String(gameRow.gameCode ?? ""),
			]);
			const players: Record<string, any> = {};
			for (const row of playersRes.rows) {
				const id = typeof row.id === "string" ? row.id : String(row.id);
				players[id] = {
					id,
					name: typeof row.name === "string" ? row.name : String(row.name ?? ""),
					role: typeof row.role === "string" ? row.role : String(row.role ?? ""),
					wins: typeof row.wins === "number" ? row.wins : Number(row.wins ?? 0),
					symbol: typeof row.symbol === "string" ? row.symbol : String(row.symbol ?? ""),
				};
			}
			games.push({
				gameCode:
					typeof gameRow.gameCode === "string"
						? gameRow.gameCode
						: String(gameRow.gameCode ?? ""),
				status:
					typeof gameRow.status === "string"
						? (gameRow.status as Game["status"])
						: "waiting",
				board: typeof gameRow.board === "string" ? JSON.parse(gameRow.board) : [],
				currentTurn: typeof gameRow.currentTurn === "string" ? gameRow.currentTurn : null,
				winner: typeof gameRow.winner === "string" ? gameRow.winner : null,
				players,
			});
		}
		return games;
	});
}
