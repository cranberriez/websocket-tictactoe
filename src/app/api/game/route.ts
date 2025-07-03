import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";
import { GameEventType } from "@/types/game";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { gameId, event } = body;

		// Validate the request
		if (!gameId || !event) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// Handle different event types
		switch (event as GameEventType) {
			case "game-move":
				const { squares, nextPlayer } = body;
				if (!squares || !nextPlayer) {
					return NextResponse.json({ error: "Missing game state data" }, { status: 400 });
				}

				// Trigger the event to all clients subscribed to this game channel
				await pusherServer.trigger(`game-${gameId}`, "game-updated", {
					squares,
					nextPlayer,
					type: "move"
				});
				break;

			case "player-join":
				const { playerId } = body;
				if (!playerId) {
					return NextResponse.json({ error: "Missing player ID" }, { status: 400 });
				}

				// Notify that a player has joined
				await pusherServer.trigger(`game-${gameId}`, "player-updated", {
					playerId,
					type: "join"
				});
				break;

			case "game-start":
				const { nextPlayer: startingPlayer } = body;
				
				// Notify that the game has started
				await pusherServer.trigger(`game-${gameId}`, "game-state-changed", {
					hasStarted: true,
					nextPlayer: startingPlayer,
					type: "start"
				});
				break;

			case "game-reset":
				const { nextPlayer: resetNextPlayer } = body;
				
				// Notify that the game has been reset
				await pusherServer.trigger(`game-${gameId}`, "game-state-changed", {
					squares: Array(9).fill(null),
					nextPlayer: resetNextPlayer,
					winner: null,
					type: "reset"
				});
				break;

			case "game-end":
				const { winner } = body;
				
				// Notify that the game has ended
				await pusherServer.trigger(`game-${gameId}`, "game-state-changed", {
					winner: winner || "draw",
					isComplete: true,
					type: "end"
				});
				break;

			default:
				return NextResponse.json({ error: "Invalid event type" }, { status: 400 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error processing game event:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
