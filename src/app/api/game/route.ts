import { NextRequest, NextResponse } from "next/server";
import { pusherServer } from "@/lib/pusher-server";

export async function POST(req: NextRequest) {
	try {
		const { gameId, squares, nextPlayer, event } = await req.json();

		// Validate the request
		if (!gameId || !event) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// Handle different event types
		switch (event) {
			case "game-move":
				if (!squares || !nextPlayer) {
					return NextResponse.json({ error: "Missing game state data" }, { status: 400 });
				}

				// Trigger the event to all clients subscribed to this game channel
				await pusherServer.trigger(`game-${gameId}`, "game-updated", {
					squares,
					nextPlayer,
				});
				break;

			case "game-join":
				// Notify that a player has joined
				await pusherServer.trigger(`game-${gameId}`, "player-joined", {
					message: "A new player has joined the game",
				});
				break;

			case "game-end":
				// Notify that the game has ended
				await pusherServer.trigger(`game-${gameId}`, "game-over", {
					winner: squares ? squares.winner || "draw" : "unknown",
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
