"use client";

import { useEffect, useState } from "react";
import { getPlayerId, ensurePlayerId } from "@/lib/playerId";
import { useParams, useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { Game, Player } from "@/types/game";
import GameLoading from "@/components/GameLoading";
import GameError from "@/components/GameError";
import GameNotFound from "@/components/GameNotFound";

export default function GamePage() {
	const params = useParams();
	const router = useRouter();
	const gameCode = params.gameCode as string;

	const [game, setGame] = useState<Game | null>(null);
	const [playerId, setPlayerId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [gameResult, setGameResult] = useState<string | null>(null);

	useEffect(() => {
		// Get the player ID from utility - use ensurePlayerId to guarantee a consistent ID
		const storedPlayerId = ensurePlayerId();
		setPlayerId(storedPlayerId);
		console.log("[GAME] Using player ID:", storedPlayerId);

		// Fetch the game data when the component mounts
		const fetchGame = async () => {
			try {
				const response = await fetch(`/api/game/${gameCode}`);

				if (!response.ok) {
					throw new Error("Game not found");
				}

				const data = await response.json();
				setGame(data.game);
			} catch (error) {
				console.error("Error fetching game:", error);
				setError("Game not found or has expired");
			} finally {
				setIsLoading(false);
			}
		};

		fetchGame();

		// Subscribe to Pusher channel for real-time updates
		const channel = pusherClient.subscribe(`game-${gameCode}`);

		channel.bind("move-made", (data: { game: Game }) => {
			setGame(data.game);
			console.log("[GAME] Move made, updated game state:", data.game);

			// Check if the game is finished
			if (data.game.status === "finished") {
				if (data.game.winner) {
					const winner = data.game.players[playerId as string];
					if (winner) {
						setGameResult(`${winner.name} wins!`);
					}
				} else {
					setGameResult("It's a tie!");
				}
			}
		});

		channel.bind("game-started", (data: { game: Game }) => {
			console.log("[GAME] Game started event received:", data.game);
			setGame(data.game);
		});

		channel.bind("game-restarted", (data: { game: Game }) => {
			console.log("[GAME] Game restarted event received:", data.game);
			setGame(data.game);
			setGameResult(null);
		});

		return () => {
			pusherClient.unsubscribe(`game-${gameCode}`);
		};
	}, [gameCode, router]);

	const handleMakeMove = async (index: number) => {
		// Check if it's the player's turn
		if (!game || game.currentTurn !== playerId || game.board[index] !== null) {
			return;
		}

		try {
			const response = await fetch(`/api/game/${gameCode}/move`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					playerId,
					position: index,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to make move");
			}

			// Game update will come through Pusher
		} catch (error) {
			console.error("Error making move:", error);
			setError("Failed to make move");
		}
	};

	const handleRestartGame = async () => {
		// Only the host can restart the game
		const myPlayerId = getPlayerId();
		const isHost = game?.players[myPlayerId as string]?.role === "host";
		if (!isHost) return;

		try {
			const response = await fetch(`/api/game/${gameCode}/restart`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to restart game");
			}

			// Game update will come through Pusher
		} catch (error) {
			console.error("Error restarting game:", error);
			setError("Failed to restart game");
		}
	};

	if (isLoading) {
		return <GameLoading />;
	}

	if (error) {
		return <GameError error={error} />;
	}

	if (!game) {
		return <GameNotFound />;
	}

	// Use player object for lookup
	const currentPlayer: Player | undefined = playerId ? game.players[playerId] : undefined;
	const opponent: Player | undefined = Object.values(
		game.players as { [id: string]: Player }
	).find((p: Player) => p.id !== playerId);
	const isMyTurn = game.currentTurn === playerId;
	const isHost = currentPlayer?.role === "host";

	// Debug logging for turn state
	console.log("[GAME] Turn state:", {
		myPlayerId: playerId,
		currentTurn: game.currentTurn,
		isMyTurn,
		players: game.players,
		currentPlayer,
		opponent,
	});

	// Use assigned symbols
	const playerSymbol = currentPlayer?.symbol;
	const opponentSymbol = opponent?.symbol;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
			<div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
					Tic Tac Toe
				</h1>

				<div className="flex justify-between items-center mb-6">
					<div className="text-center">
						<div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-600 text-white font-bold rounded-full">
							{playerSymbol}
						</div>
						<p className="font-medium text-gray-800 dark:text-white">
							{currentPlayer?.name || "You"}
						</p>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Wins: {currentPlayer?.wins || 0}
						</p>
					</div>

					<div className="text-center">
						<p className="text-lg font-semibold text-gray-700 dark:text-gray-300">vs</p>
					</div>

					<div className="text-center">
						<div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-red-600 text-white font-bold rounded-full">
							{opponentSymbol}
						</div>
						<p className="font-medium text-gray-800 dark:text-white">
							{opponent?.name || "Opponent"}
						</p>
						<p className="text-sm text-gray-600 dark:text-gray-400">
							Wins: {opponent?.wins || 0}
						</p>
					</div>
				</div>

				{gameResult ? (
					<div className="mb-6 p-3 text-center bg-blue-100 dark:bg-blue-900 rounded-md">
						<p className="text-lg font-bold text-blue-800 dark:text-blue-200">
							{gameResult}
						</p>
						{isHost && game.status === "finished" && (
							<button
								onClick={handleRestartGame}
								className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
							>
								Play Again
							</button>
						)}
						{!isHost && game.status === "finished" && (
							<p className="mt-3 text-sm text-blue-700 dark:text-blue-300">
								Waiting for host to restart the game...
							</p>
						)}
					</div>
				) : (
					<div className="mb-6 p-3 text-center bg-blue-100 dark:bg-blue-900 rounded-md">
						<p className="text-lg font-medium text-blue-800 dark:text-blue-200">
							{isMyTurn ? "Your turn" : `${opponent?.name || "Opponent"}'s turn`}
						</p>
					</div>
				)}

				<div className="grid grid-cols-3 gap-2 mb-6">
					{game.board.map((cell, index) => (
						<button
							key={index}
							onClick={() => handleMakeMove(index)}
							disabled={cell !== null || !isMyTurn || game.status === "finished"}
							className={`
                w-full aspect-square flex items-center justify-center text-3xl font-bold
                border-2 border-gray-300 dark:border-gray-600 rounded-md
                ${
					cell === null && isMyTurn && game.status !== "finished"
						? "hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
						: "cursor-not-allowed"
				}
                ${cell === "X" ? "text-blue-600 dark:text-blue-400" : ""}
                ${cell === "O" ? "text-red-600 dark:text-red-400" : ""}
              `}
						>
							{cell}
						</button>
					))}
				</div>

				<div className="text-center text-sm text-gray-600 dark:text-gray-400">
					<p>
						Game Code: <span className="font-mono font-bold">{gameCode}</span>
					</p>
				</div>
			</div>
		</div>
	);
}
