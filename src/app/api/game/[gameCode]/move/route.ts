import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGame, setGame } from "@/lib/gameStore";

// Check for a winner
function checkWinner(board: (string | null)[]): string | null {
	const winPatterns = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8], // rows
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8], // columns
		[0, 4, 8],
		[2, 4, 6], // diagonals
	];

	for (const pattern of winPatterns) {
		const [a, b, c] = pattern;
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return board[a];
		}
	}

	return null;
}

// Check if the board is full (tie)
function isBoardFull(board: (string | null)[]): boolean {
	return board.every((cell) => cell !== null);
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ gameCode: string }> }
) {
	console.log("[MOVE] Incoming move request", { params });
	try {
		// Await params to fix the dynamic route parameter bug
		const { gameCode } = await params;
		const body = await request.json();
		const { playerId, position } = body;
		console.log("[MOVE] Parsed body", { playerId, position });

		// Get the game from the centralized store
		const game = getGame(gameCode);
		console.log("[MOVE] Loaded game from store", { gameCode, game });

		// Check if the game exists
		if (!game) {
			console.warn(`[MOVE] Game not found for code: ${gameCode}`);
			return NextResponse.json({ error: "Game not found" }, { status: 404 });
		}

		// Check if the game is in progress
		if (game.status !== "playing") {
			console.warn(`[MOVE] Game is not in progress. Status: ${game.status}`);
			return NextResponse.json({ error: "Game is not in progress" }, { status: 400 });
		}

		// Check if it's the player's turn
		if (game.currentTurn !== playerId) {
			console.warn(
				`[MOVE] Not player's turn. CurrentTurn: ${game.currentTurn}, playerId: ${playerId}`
			);
			return NextResponse.json({ error: "Not your turn" }, { status: 400 });
		}

		// Check if the position is valid and empty
		if (position < 0 || position >= 9 || game.board[position] !== null) {
			console.warn(`[MOVE] Invalid move position`, { position, board: game.board });
			return NextResponse.json({ error: "Invalid move" }, { status: 400 });
		}

		// Make the move
		game.board[position] = game.players[playerId]?.symbol || null;
		console.log(`[MOVE] Move made`, {
			playerId,
			symbol: game.players[playerId]?.symbol,
			position,
			board: game.board,
		});

		// Check for a winner
		const winningSymbol = checkWinner(game.board);

		if (winningSymbol) {
			console.log(`[MOVE] Winner detected`, { playerId, winningSymbol });
			// We have a winner
			game.status = "finished";
			game.winner = playerId;
			if (game.players[playerId]) {
				game.players[playerId].wins += 1;
			}
		} else if (isBoardFull(game.board)) {
			console.log(`[MOVE] Board full, game is a tie`, { board: game.board });
			// It's a tie
			game.status = "finished";
			game.winner = null;
		} else {
			// Switch turns
			const playerIds = Object.keys(game.players);
			const nextPlayerId = playerIds.find((id) => id !== playerId) || playerId;
			game.currentTurn = nextPlayerId;
			console.log(`[MOVE] Next turn`, { nextPlayerId, board: game.board });
		}

		// Update the game in the centralized store
		setGame(gameCode, game);

		// Trigger a Pusher event to notify all players of the move
		await pusher.trigger(`game-${gameCode}`, "move-made", {
			game,
		});

		return NextResponse.json({ success: true, game });
	} catch (error) {
		console.error("Error making move:", error);
		return NextResponse.json({ error: "Failed to make move" }, { status: 500 });
	}
}
