"use client";

import React, { useState, useEffect, useReducer } from "react";
import { useRouter } from "next/navigation";
import { getPusherClient } from "@/lib/pusher";
import Game from "./Game";
import Lobby from "./Lobby";
import PlayerList from "./PlayerList";
import TurnIndicator from "./TurnIndicator";
import { gameReducer, initialGameState, generateRoomCode } from "@/services/gameService";
import { apiService } from "@/services/apiService";
import { Player, PlayerSymbol, GameState } from "@/types/game";

interface OnlineGameProps {
	mode: "create" | "join";
	gameId?: string;
}

const OnlineGame: React.FC<OnlineGameProps> = ({ mode, gameId: inputGameId }) => {
	const [gameId, setGameId] = useState<string>(inputGameId || "");
	const [playerId, setPlayerId] = useState<string>("");
	const [joinInput, setJoinInput] = useState<string>("");
	const [error, setError] = useState<string>("");
	const [message, setMessage] = useState<string>("");
	const router = useRouter();

	// Use the game reducer to manage game state
	const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

	// Initialize game
	useEffect(() => {
		if (mode === "create") {
			// Generate a shorter 6-character room code
			const newGameId = generateRoomCode();
			setGameId(newGameId);

			// Create a unique player ID
			const newPlayerId = generateRoomCode();
			setPlayerId(newPlayerId);

			// Initialize the game state
			dispatch({
				type: "INITIALIZE_GAME",
				payload: { gameId: newGameId, playerId: newPlayerId },
			});

			setMessage(`Game created! Share this code with your friend: ${newGameId}`);
		}
	}, [mode]);

	// Join an existing game
	const handleJoinGame = async (e?: React.MouseEvent) => {
		const joinCode = joinInput;
		if (!joinCode) {
			setError("Please enter a game code");
			return;
		}

		setGameId(joinCode);
		// Generate unique player ID for guest
		const newPlayerId = generateRoomCode();
		setPlayerId(newPlayerId);

		try {
			// Add the player to game state
			dispatch({
				type: "JOIN_GAME",
				payload: { playerId: newPlayerId, isYou: true },
			});

			// Notify the server that a player has joined
			await apiService.joinGame(joinCode, newPlayerId);
		} catch (err) {
			console.error("Error joining game:", err);
			setError("Failed to join the game. Please try again.");
		}
	};

	// Start a created game
	const handleStartGame = async () => {
		// Check if user is host
		const isHost = gameState.players.some((p) => p.id === playerId && p.role === "host");
		if (!isHost) return;

		// Check if there's at least one guest player
		const hasGuest = gameState.players.some((p) => p.role === "guest");
		if (!hasGuest) {
			setError("Waiting for another player to join...");
			return;
		}

		// Randomly select who goes first (X or O)
		const randomFirstPlayer: PlayerSymbol = Math.random() < 0.5 ? "X" : "O";
		console.log(`Random first player selected: ${randomFirstPlayer}`);

		// Start the game
		dispatch({
			type: "START_GAME",
			payload: { nextPlayer: randomFirstPlayer },
		});

		// Notify the server that game has started with randomly selected player
		try {
			await apiService.startGame(gameId, randomFirstPlayer);
		} catch (err) {
			console.error("Error starting game:", err);
		}
	};

	// Handle game reset (host only)
	const handleGameReset = async () => {
		// Check if user is host
		const isHost = gameState.players.some((p) => p.id === playerId && p.role === "host");
		if (!isHost) return;

		// Reset the game
		dispatch({ type: "RESET_GAME" });

		// Notify the server
		try {
			await apiService.resetGame(gameId, gameState.nextPlayer);
		} catch (err) {
			console.error("Error resetting game:", err);
		}
	};

	// Handle move through the game service
	const handleMove = async (index: number) => {
		// Check if it's the player's turn
		const playerSymbol = gameState.players.find((p) => p.id === playerId)?.symbol;
		if (gameState.nextPlayer !== playerSymbol) return;

		// Apply move to local state first
		const newState = {
			...gameState,
			squares: [...gameState.squares],
		};
		newState.squares[index] = playerSymbol;

		// Determine next player
		const nextPlayer = gameState.nextPlayer === "X" ? "O" : "X";

		dispatch({
			type: "MAKE_MOVE",
			payload: { index, playerId },
		});

		// Send the move to the server
		try {
			await apiService.sendGameMove(gameId, newState.squares, nextPlayer);
		} catch (err) {
			console.error("Error updating game:", err);
		}
	};

	// Get the current player symbol
	const getCurrentPlayerSymbol = (): PlayerSymbol | undefined => {
		return gameState.players.find((p) => p.id === playerId)?.symbol;
	};

	// Check if the current player is the host
	const isHost = (): boolean => {
		return gameState.players.some((p) => p.id === playerId && p.role === "host");
	};

	// Set up Pusher subscription
	useEffect(() => {
		if (!gameId) return;

		const pusher = getPusherClient();
		const channel = pusher.subscribe(`game-${gameId}`);

		// Listen for game events
		channel.bind("game-move", (data: any) => {
			// Update local game state with new move
			dispatch({
				type: "SYNC_GAME_STATE",
				payload: data.gameState,
			});
		});

		channel.bind("game-join", (data: any) => {
			setMessage("Another player has joined the game!");
			dispatch({
				type: "JOIN_GAME",
				payload: { playerId: data.playerId, isYou: false },
			});
		});

		channel.bind("game-start", (data: any) => {
			setMessage("Game has started!");
			dispatch({
				type: "SYNC_GAME_STATE",
				payload: data.gameState,
			});
		});

		channel.bind("game-reset", (data: any) => {
			setMessage("Game has been reset!");
			dispatch({
				type: "SYNC_GAME_STATE",
				payload: data.gameState,
			});
		});

		channel.bind("game-end", (data: any) => {
			// Handle game end
			dispatch({
				type: "SYNC_GAME_STATE",
				payload: data.gameState,
			});
		});

		return () => {
			channel.unbind_all();
			pusher.unsubscribe(`game-${gameId}`);
		};
	}, [gameId]);

	// Show lobby before game starts
	if (!gameState.hasStarted) {
		return (
			<div className="flex flex-col gap-4">
				{message && (
					<div className="bg-blue-100 dark:bg-blue-900 p-4 rounded mb-4">{message}</div>
				)}
				{error && (
					<div className="bg-red-100 dark:bg-red-900 p-4 rounded mb-4 text-red-600">
						{error}
					</div>
				)}

				{/* Use the Lobby component */}
				{mode === "create" ? (
					<Lobby
						gameId={gameId}
						players={gameState.players}
						currentPlayerId={playerId}
						onStartGame={handleStartGame}
						onJoinGame={() => {}}
					/>
				) : (
					<>
						<div className="flex flex-col gap-2">
							<label
								htmlFor="gameCode"
								className="text-sm font-medium"
							>
								Enter Game Code:
							</label>
							<input
								id="gameCode"
								type="text"
								value={joinInput}
								onChange={(e) => setJoinInput(e.target.value)}
								className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								placeholder="Enter the 6-character game code"
							/>

							<button
								onClick={handleJoinGame}
								className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
							>
								Join Game
							</button>
						</div>
					</>
				)}

				{/* Show player list if we're in a game */}
				{gameState.players.length > 0 && (
					<PlayerList
						players={gameState.players}
						currentPlayerId={playerId}
					/>
				)}
			</div>
		);
	}

	// Game is active, show game board
	return (
		<div>
			{message && (
				<div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded">{message}</div>
			)}

			{/* Show player list */}
			<PlayerList
				players={gameState.players}
				currentPlayerId={playerId}
			/>

			{/* Turn indicator shows whose turn it is */}
			<TurnIndicator
				currentPlayer={gameState.nextPlayer}
				yourSymbol={getCurrentPlayerSymbol() || "X"}
				isGameOver={gameState.isComplete}
				winner={gameState.winner}
			/>

			{/* Game board */}
			<div className="mt-4">
				<Game
					gameId={gameId}
					playerId={playerId}
					onlineMode={true}
					externalSquares={gameState.squares}
					externalNextPlayer={gameState.nextPlayer}
					onGameUpdate={(squares, nextPlayer) => {
						// Find which square changed to determine the index
						for (let i = 0; i < gameState.squares.length; i++) {
							if (gameState.squares[i] !== squares[i] && squares[i] !== null) {
								handleMove(i);
								break;
							}
						}
					}}
				/>
			</div>

			{/* Only host can reset the game */}
			{isHost() && gameState.hasStarted && (
				<button
					onClick={handleGameReset}
					className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
				>
					Reset Game
				</button>
			)}
		</div>
	);
};

export default OnlineGame;
