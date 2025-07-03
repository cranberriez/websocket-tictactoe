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
	const handleJoinGame = async (joinCode: string) => {
		setError("");
		if (!joinCode) {
			setError("Please enter a game code.");
			return;
		}

		try {
			// Generate player ID and set state
			const newPlayerId = generateRoomCode();
			setPlayerId(newPlayerId);
			setGameId(joinCode);

			// Try to join the game on the server
			const response = await apiService.joinGame(joinCode, newPlayerId);
			if (!response.ok) {
				const errorData = await response.json();
				if (response.status === 400 || response.status === 404) {
					setError("Game does not exist or is not joinable. Please check the code.");
				} else {
					setError(errorData.error || "Failed to join the game. Please try again.");
				}
				// Reset gameId on error
				setGameId("");
				return;
			}

			// Add the player to local game state
			dispatch({
				type: "JOIN_GAME",
				payload: { playerId: newPlayerId, isYou: true },
			});

			// Show success message
			setMessage("Successfully joined the game! Waiting for host to start...");

			// No need to refresh the page - the Pusher subscription will handle updates
		} catch (err) {
			console.error("Error joining game:", err);
			setError("Network error or server unavailable. Please try again.");
			// Reset gameId on error
			setGameId("");
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
		channel.bind("game-updated", (data: any) => {
			// Update local game state with new move
			if (data.type === "move") {
				dispatch({
					type: "SYNC_GAME_STATE",
					payload: { squares: data.squares, nextPlayer: data.nextPlayer },
				});
			}
		});

		channel.bind("player-updated", (data: any) => {
			if (data.type === "join") {
				setMessage("Another player has joined the game!");
				dispatch({
					type: "JOIN_GAME",
					payload: { playerId: data.playerId, isYou: false },
				});
			}
		});

		channel.bind("game-state-changed", (data: any) => {
			switch (data.type) {
				case "start":
					setMessage("Game has started!");
					dispatch({
						type: "START_GAME",
						payload: { nextPlayer: data.nextPlayer },
					});
					break;
				case "reset":
					setMessage("Game has been reset!");
					dispatch({
						type: "RESET_GAME",
						payload: { nextPlayer: data.nextPlayer },
					});
					break;
				case "end":
					setMessage(data.winner === "draw" ? "Game ended in a draw!" : `${data.winner} wins!`);
					dispatch({
						type: "END_GAME",
						payload: { winner: data.winner },
					});
					break;
			}
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
						onJoinGame={handleJoinGame}
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
								onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
								className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-wider uppercase"
								placeholder="ABCD12"
								maxLength={6}
							/>

							<button
								onClick={(e) => {
									e.preventDefault(); // Prevent default form submission
									handleJoinGame(joinInput);
								}}
								className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
							>
								Join Game
							</button>
						</div>
						{message && (
							<div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900 rounded">{message}</div>
						)}
					</>
				)}

				{/* Show player list if we're in a game */}
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
