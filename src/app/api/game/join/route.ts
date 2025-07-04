import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGame } from "@/lib/gameStore";
import { Player } from "@/types/game";

export async function POST(request: Request) {
	try {
		const { playerName, gameCode } = await request.json();

		const game = getGame(gameCode);
		// Check if the game exists
		if (!game) {
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Check if the game is already full
		if (game.players.length >= 2) {
			return NextResponse.json({ error: "Game is already full" }, { status: 400 });
		}

		// Add the player to the game
		const newPlayer: Player = {
			id: Date.now().toString(), // Simple ID for demo purposes
			name: playerName,
			role: "guest",
			wins: 0,
		};

		game.players.push(newPlayer);

		// Trigger a Pusher event to notify the host that a player has joined
		await pusher.trigger(`game-${gameCode}`, "player-joined", {
			player: newPlayer,
			players: game.players,
		});

		return NextResponse.json({ success: true, game });
	} catch (error) {
		console.error("Error joining game:", error);
		return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
	}
}
