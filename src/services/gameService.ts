import { GameState, GameAction, PlayerSymbol, Player, PlayerRole } from "@/types/game";

// Helper function to calculate winner
export function calculateWinner(
	squares: Array<string | null>
): { winner: string; line: number[] } | null {
	const lines = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8],
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8],
		[0, 4, 8],
		[2, 4, 6],
	];

	for (let i = 0; i < lines.length; i++) {
		const [a, b, c] = lines[i];
		if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
			return { winner: squares[a] as string, line: lines[i] };
		}
	}

	return null;
}

// Generate a short 6-character room code
export function generateRoomCode(): string {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let result = "";

	for (let i = 0; i < 6; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		result += characters.charAt(randomIndex);
	}

	return result;
}

// Check if it's a draw
export function isDraw(squares: Array<string | null>): boolean {
	return squares.every((square) => square !== null);
}

// Check if it's a player's turn based on their symbol
export function isPlayerTurn(currentPlayer: PlayerSymbol, playerSymbol: PlayerSymbol): boolean {
	return currentPlayer === playerSymbol;
}

// Randomly determine starting player
export function getRandomStartingPlayer(): PlayerSymbol {
	return Math.random() < 0.5 ? "X" : "O";
}

// Initial game state
export const initialGameState: GameState = {
	id: "",
	squares: Array(9).fill(null),
	nextPlayer: "X",
	winner: null,
	winningLine: [],
	players: [],
	hasStarted: false,
	isComplete: false,
};

// Game reducer function for state management
export function gameReducer(state: GameState, action: GameAction): GameState {
	switch (action.type) {
		case "INITIALIZE_GAME":
			return {
				...initialGameState,
				id: action.payload.gameId,
				players: [
					{
						id: action.payload.playerId,
						symbol: "X",
						role: "host",
						isYou: true,
					},
				],
			};

		case "JOIN_GAME":
			// Don't add duplicate players
			if (state.players.some((p) => p.id === action.payload.playerId)) {
				return state;
			}

			return {
				...state,
				players: [
					...state.players,
					{
						id: action.payload.playerId,
						symbol: "O", // Guest is always O initially
						role: "guest",
						isYou: action.payload.isYou,
					},
				],
			};

		case "START_GAME": {
			// Randomize starting player
			const startingPlayer = getRandomStartingPlayer();
			return {
				...state,
				hasStarted: true,
				nextPlayer: startingPlayer,
			};
		}

		case "MAKE_MOVE": {
			const { index, playerId } = action.payload;
			const squares = [...state.squares];
			const player = state.players.find((p) => p.id === playerId);

			// Validate move
			if (
				state.winner ||
				squares[index] ||
				!player ||
				player.symbol !== state.nextPlayer ||
				!state.hasStarted
			) {
				return state;
			}

			// Make the move
			squares[index] = state.nextPlayer;

			// Check for winner
			const winResult = calculateWinner(squares);
			const isDraw = squares.every((square) => square !== null);

			return {
				...state,
				squares,
				nextPlayer: state.nextPlayer === "X" ? "O" : "X",
				winner: winResult ? winResult.winner : null,
				winningLine: winResult ? winResult.line : [],
				isComplete: !!winResult || isDraw,
			};
		}

		case "SYNC_GAME_STATE":
			return {
				...state,
				squares: action.payload.squares || state.squares,
				nextPlayer: action.payload.nextPlayer || state.nextPlayer,
				winner: action.payload.winner !== undefined ? action.payload.winner : state.winner,
				winningLine: action.payload.winningLine || state.winningLine,
				hasStarted:
					action.payload.hasStarted !== undefined
						? action.payload.hasStarted
						: state.hasStarted,
				isComplete:
					action.payload.isComplete !== undefined
						? action.payload.isComplete
						: state.isComplete,
			};

		case "RESET_GAME":
			return {
				...state,
				squares: Array(9).fill(null),
				nextPlayer: getRandomStartingPlayer(),
				winner: null,
				winningLine: [],
				hasStarted: true, // Keep the game started
				isComplete: false,
			};

		default:
			return state;
	}
}
