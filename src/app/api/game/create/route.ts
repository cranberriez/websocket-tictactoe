import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGames, setGame } from "@/lib/gameStore";
import { Game, Player } from "@/types/game";

// Generate a random 6-character game code
function generateGameCode(): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let result = "";
	for (let i = 0; i < 6; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

export async function POST(request: Request) {
	try {
		const { playerName, playerId } = await request.json();
		console.log("[CREATE] Received request:", { playerName, playerId });

		// Generate a unique game code
		let gameCode = generateGameCode();
		const games = getGames();
		while (games.some((g) => g.gameCode === gameCode)) {
			console.warn(`[CREATE] Collision on gameCode: ${gameCode}, regenerating...`);
			gameCode = generateGameCode();
		}
		console.log(`[CREATE] Using gameCode: ${gameCode}`);

		// Create a new game with the host player
		const hostPlayer: Player = {
			id: playerId,
			name: playerName,
			role: "host",
			wins: 0,
		};
		console.log("[CREATE] Host player:", hostPlayer);

		const game: Game = {
			gameCode,
			players: [hostPlayer],
			status: "waiting", // waiting, playing, finished
			board: Array(9).fill(null),
			currentTurn: null,
			winner: null,
		};
		console.log("[CREATE] Game object:", game);

		// Store the game
		setGame(gameCode, game);
		console.log(`[CREATE] Game stored for code: ${gameCode}`);

		// Trigger a Pusher event to create the game channel
		await pusher.trigger(`game-${gameCode}`, "game-created", {
			gameCode,
			host: game.players[0],
		});
		console.log(`[CREATE] Pusher event triggered for gameCode: ${gameCode}`);

		return NextResponse.json({ gameCode, game });
	} catch (error) {
		console.error("[CREATE] Error creating game:", error);
		return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
	}
}

// No need to export games anymore as we're using the centralized game store
