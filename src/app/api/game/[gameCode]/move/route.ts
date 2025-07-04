import { NextResponse } from "next/server";
import { pusher } from "@/lib/pusher";
import { getGame, setGame } from "@/lib/gameStore";
import { Player, Game } from "@/types/game";

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

export async function POST(request: Request, { params }: { params: { gameCode: string } }) {
	try {
		// Await params to fix the dynamic route parameter bug
		const { gameCode } = await Promise.resolve(params);
		const { playerId, position } = await request.json();

		// Get the game from the centralized store
		let game = getGame(gameCode);

		// Check if the game exists
		if (!game) {
			return NextResponse.json({ error: 'Game not found' }, { status: 404 });
		}

		// Check if the game is in progress
		if (game.status !== "playing") {
			return NextResponse.json({ error: "Game is not in progress" }, { status: 400 });
		}

		// Check if it's the player's turn
		if (game.currentTurn !== playerId) {
			return NextResponse.json({ error: "Not your turn" }, { status: 400 });
		}

		// Check if the position is valid and empty
		if (position < 0 || position >= 9 || game.board[position] !== null) {
			return NextResponse.json({ error: "Invalid move" }, { status: 400 });
		}

		// Find the player
		const playerIndex = game.players.findIndex((p: Player) => p.id === playerId);
		if (playerIndex === -1) {
			return NextResponse.json({ error: "Player not found" }, { status: 400 });
		}

		// Make the move
		game.board[position] = playerIndex === 0 ? "X" : "O";

		// Check for a winner
		const symbol = playerIndex === 0 ? "X" : "O";
		const winningSymbol = checkWinner(game.board);

		if (winningSymbol) {
			// We have a winner
			game.status = "finished";
			game.winner = playerId;
			game.players[playerIndex].wins += 1;
		} else if (isBoardFull(game.board)) {
			// It's a tie
			game.status = "finished";
			game.winner = null;
		} else {
			// Switch turns
			const nextPlayerIndex = (playerIndex + 1) % 2;
			game.currentTurn = game.players[nextPlayerIndex].id;
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
