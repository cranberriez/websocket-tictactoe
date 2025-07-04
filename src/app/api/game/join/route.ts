import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGame, setGame } from "@/lib/gameStore";
import { Player } from "@/types/game";

export async function POST(request: Request) {
	try {
		const { playerName, playerId, gameCode } = await request.json();

		const game = await getGame(gameCode);
		// Check if the game exists
		if (!game) {
			console.error(`[JOIN] Game not found. gameCode: ${gameCode}, playerId: ${playerId}`);
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Always fetch the latest game from the DB (in case of race conditions)
		const latestGame = await getGame(gameCode);
		if (!latestGame) {
			console.error(
				`[JOIN] Latest game not found. gameCode: ${gameCode}, playerId: ${playerId}`
			);
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Check if the player is already in the game
		if (latestGame.players[playerId]) {
			console.error(
				`[JOIN] Player already joined. gameCode: ${gameCode}, playerId: ${playerId}, players:`,
				latestGame.players
			);
			return NextResponse.json({ error: "Player already joined" }, { status: 400 });
		}

		// If the game is full and player is not in it, return room full error
		if (Object.keys(latestGame.players).length >= 2) {
			console.error(
				`[JOIN] Game is already full. gameCode: ${gameCode}, playerId: ${playerId}, players:`,
				latestGame.players
			);
			return NextResponse.json({ error: "Game is already full" }, { status: 400 });
		}

		// Add the new player as guest with symbol 'O'
		const newPlayer: Player = {
			id: playerId,
			name: playerName,
			role: "guest",
			wins: 0,
			symbol: "O",
		};

		const updatedPlayers = { ...latestGame.players, [playerId]: newPlayer };
		const updatedGame = { ...latestGame, players: updatedPlayers };
		setGame(gameCode, updatedGame);

		// Trigger a Pusher event to notify the host that a player has joined
		await pusher.trigger(`game-${gameCode}`, "player-joined", {
			player: newPlayer,
			players: updatedPlayers,
		});

		return NextResponse.json({ success: true, game: updatedGame });
	} catch (error) {
		console.error("Error joining game:", error);
		return NextResponse.json({ error: "Failed to join game" }, { status: 500 });
	}
}
