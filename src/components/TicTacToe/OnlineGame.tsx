"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { getPusherClient } from "@/lib/pusher";
import Game from "./Game";

interface OnlineGameProps {
	mode: "create" | "join";
	gameId?: string;
}

const OnlineGame: React.FC<OnlineGameProps> = ({ mode, gameId: inputGameId }) => {
	const [gameId, setGameId] = useState<string>(inputGameId || "");
	const [playerId, setPlayerId] = useState<string>("");
	const [joinInput, setJoinInput] = useState<string>("");
	const [gameActive, setGameActive] = useState<boolean>(false);
	const [error, setError] = useState<string>("");
	const [message, setMessage] = useState<string>("");
	const router = useRouter();

	// Initialize game
	useEffect(() => {
		if (mode === "create") {
			// Generate a new game ID
			const newGameId = uuidv4();
			setGameId(newGameId);
			setPlayerId(newGameId); // Creator is player 1
			setMessage(`Game created! Share this code with your friend: ${newGameId}`);
		}
	}, [mode]);

	// Join an existing game
	const handleJoinGame = async () => {
		if (!joinInput) {
			setError("Please enter a game code");
			return;
		}

		setGameId(joinInput);
		setPlayerId(uuidv4()); // Joiner gets a unique ID
		setGameActive(true);

		try {
			// Notify the server that a player has joined
			await fetch("/api/game", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					gameId: joinInput,
					event: "game-join",
				}),
			});
		} catch (err) {
			console.error("Error joining game:", err);
			setError("Failed to join the game. Please try again.");
		}
	};

	// Start a created game
	const handleStartGame = () => {
		setGameActive(true);
	};

	// Handle game updates
	const handleGameUpdate = async (squares: Array<string | null>, nextPlayer: string) => {
		try {
			await fetch("/api/game", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					gameId,
					squares,
					nextPlayer,
					event: "game-move",
				}),
			});
		} catch (err) {
			console.error("Error updating game:", err);
		}
	};

	// Handle game end
	const handleGameEnd = async (winner: string | null) => {
		try {
			await fetch("/api/game", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					gameId,
					winner,
					event: "game-end",
				}),
			});
		} catch (err) {
			console.error("Error ending game:", err);
		}
	};

	// Game state management for online play
	const [gameSquares, setGameSquares] = useState<Array<string | null>>(Array(9).fill(null));
	const [currentPlayer, setCurrentPlayer] = useState<string>("X");

	// Set up Pusher subscription
	useEffect(() => {
		if (!gameId || !gameActive) return;

		const pusher = getPusherClient();
		const channel = pusher.subscribe(`game-${gameId}`);

		channel.bind(
			"game-updated",
			(data: { squares: Array<string | null>; nextPlayer: string }) => {
				// Update the game state when receiving updates from other players
				setGameSquares(data.squares);
				setCurrentPlayer(data.nextPlayer);
			}
		);

		channel.bind("player-joined", () => {
			setMessage("Another player has joined the game!");
		});

		channel.bind("game-over", (data: { winner: string }) => {
			if (data.winner === "draw") {
				setMessage("Game ended in a draw!");
			} else {
				setMessage(`Game over! Winner: ${data.winner}`);
			}
		});

		return () => {
			pusher.unsubscribe(`game-${gameId}`);
		};
	}, [gameId, gameActive]);

	if (!gameActive) {
		return (
			<div className="flex flex-col gap-4">
				{mode === "create" ? (
					<>
						<div className="bg-blue-100 dark:bg-blue-900 p-4 rounded">{message}</div>
						<button
							onClick={handleStartGame}
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
						>
							Start Game
						</button>
					</>
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
								placeholder="Paste the game code here"
							/>
							{error && <p className="text-red-500 text-sm">{error}</p>}
						</div>
						<button
							onClick={handleJoinGame}
							className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
						>
							Join Game
						</button>
					</>
				)}
			</div>
		);
	}

	return (
		<div>
			{message && (
				<div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 rounded">{message}</div>
			)}
			<div className="mb-4">
				<p className="text-sm font-medium">
					You are Player:{" "}
					<span className="font-bold">{playerId === gameId ? "X" : "O"}</span>
				</p>
				<p className="text-sm font-medium">
					Current Turn: <span className="font-bold">{currentPlayer}</span>
				</p>
			</div>
			<Game
				gameId={gameId}
				playerId={playerId}
				onlineMode={true}
				externalSquares={gameSquares}
				externalNextPlayer={currentPlayer}
				onGameUpdate={handleGameUpdate}
				onGameEnd={handleGameEnd}
			/>
		</div>
	);
};

export default OnlineGame;
