import { createClient, Client } from "@libsql/client";
import { Game } from "@/types/game";

// Helper function to get client with proper error handling
function getTursoClient(): Client {
	const tursoUrl = process.env.TURSO_DATABASE_URL;
	const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

	if (!tursoUrl) {
		console.error("[TURSO] Error: TURSO_DATABASE_URL environment variable is not set");
		throw new Error("Database URL not configured");
	}

	if (!tursoAuthToken) {
		console.error("[TURSO] Error: TURSO_AUTH_TOKEN environment variable is not set");
		throw new Error("Database auth token not configured");
	}

	return createClient({
		url: tursoUrl,
		authToken: tursoAuthToken,
		// Add explicit configuration for HTTP-only mode if needed for serverless
		// httpMode: 'js-fetch',
	});
}

// Create client lazily per request instead of at module scope
let client: Client | null = null;

// Get or create client
function getClient(): Client {
	if (!client) {
		client = getTursoClient();
	}
	return client;
}

// --- Turso DB schema initialization ---
async function initTursoSchema() {
	const db = getClient();
	await db.execute(`
		CREATE TABLE IF NOT EXISTS games (
			gameCode TEXT PRIMARY KEY,
			status TEXT,
			board TEXT,
			currentTurn TEXT,
			winner TEXT
		);
	`);
	await db.execute(`
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
		console.log("[TURSO] Executing DB operation...");
		const result = await fn();
		console.log("[TURSO] DB operation successful:", result);
		return result;
	} catch (e: any) {
		console.error("[TURSO] DB operation error:", e);
		if (e?.code === "SQLITE_UNKNOWN" && /no such table/.test(e.message)) {
			console.warn("[TURSO] No such table error, initializing schema...");
			await initTursoSchema();
			console.log("[TURSO] Schema initialized, retrying operation...");
			const retryResult = await fn();
			console.log("[TURSO] Retry successful:", retryResult);
			return retryResult;
		}
		throw e;
	}
}

// Utility functions for Turso DB (libsql)
export async function saveGame(game: Game) {
	console.log("[TURSO] Saving game:", game);
	const db = getClient();
	await db.execute(
		`INSERT OR REPLACE INTO games (gameCode, status, board, currentTurn, winner) VALUES (?, ?, ?, ?, ?)`,
		[game.gameCode, game.status, JSON.stringify(game.board), game.currentTurn, game.winner]
	);
	console.log("[TURSO] Saved game row for", game.gameCode);

	// Remove all players for this game and re-insert
	await db.execute(`DELETE FROM players WHERE gameCode = ?`, [game.gameCode]);
	console.log("[TURSO] Deleted old players for", game.gameCode);
	for (const player of Object.values(game.players)) {
		await db.execute(
			`INSERT INTO players (id, gameCode, name, role, wins, symbol) VALUES (?, ?, ?, ?, ?, ?)`,
			[player.id, game.gameCode, player.name, player.role, player.wins, player.symbol]
		);
		console.log("[TURSO] Inserted player", player.id, "for game", game.gameCode);
	}
	console.log("[TURSO] saveGame complete for", game.gameCode);
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	console.log("[TURSO] Fetching game:", gameCode);
	return withTursoSchemaRetry(async () => {
		const db = getClient();
		const gameRes = await db.execute(`SELECT * FROM games WHERE gameCode = ?`, [gameCode]);
		console.log("[TURSO] Game query result:", gameRes.rows);
		if (gameRes.rows.length === 0) {
			console.warn("[TURSO] No game found for", gameCode);
			return undefined;
		}
		const gameRow = gameRes.rows[0];

		const playersRes = await db.execute(`SELECT * FROM players WHERE gameCode = ?`, [gameCode]);
		console.log("[TURSO] Players query result:", playersRes.rows);
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
		const db = getClient();
		await db.execute(`DELETE FROM games WHERE gameCode = ?`, [gameCode]);
		await db.execute(`DELETE FROM players WHERE gameCode = ?`, [gameCode]);
	});
}

export async function getGames(): Promise<Game[]> {
	return withTursoSchemaRetry(async () => {
		const db = getClient();
		const gamesRes = await db.execute(`SELECT * FROM games`, []);
		const games: Game[] = [];
		for (const gameRow of gamesRes.rows) {
			const playersRes = await db.execute(`SELECT * FROM players WHERE gameCode = ?`, [
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
