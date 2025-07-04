import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGame, setGame } from "@/lib/gameStore";

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ gameCode: string }> }
) {
	try {
		// Await params to fix the dynamic route parameter bug
		const { gameCode } = await params;

		// Get the game from the centralized store
		const game = getGame(gameCode);

		// Check if the game exists
		if (!game) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Check if there are 2 players
		if (Object.keys(game.players).length < 2) {
			return NextResponse.json(
				{ error: "Need 2 players to start the game" },
				{ status: 400 }
			);
		}

		// Assign symbols deterministically (X to host, O to guest)
		for (const playerId in game.players) {
			if (game.players[playerId].role === "host") {
				game.players[playerId].symbol = "X";
			} else {
				game.players[playerId].symbol = "O";
			}
		}

		// Update the game state in the centralized store
		game.status = "playing";

		// Randomly decide who goes first
		const playerIds = Object.keys(game.players);
		console.log("[START] Available player IDs:", playerIds);
		const startingPlayerId = playerIds[Math.floor(Math.random() * playerIds.length)];
		game.currentTurn = startingPlayerId;
		console.log(
			"[START] currentTurn set to:",
			game.currentTurn,
			"player:",
			game.players[startingPlayerId]
		);

		// Reset the board
		game.board = Array(9).fill(null);
		game.winner = null;

		console.log("[START] Full game state:", JSON.stringify(game, null, 2));
		setGame(gameCode, game);

		// Trigger a Pusher event to notify all players that the game has started
		await pusher.trigger(`game-${gameCode}`, "game-started", {
			game,
		});

		return NextResponse.json({ success: true, game });
	} catch (error) {
		console.error("Error starting game:", error);
		return NextResponse.json({ error: "Failed to start game" }, { status: 500 });
	}
}
