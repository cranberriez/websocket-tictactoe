"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { Game, Player } from "@/types/game";

export default function LobbyPage() {
	const params = useParams();
	const router = useRouter();
	const gameCode = params.gameCode as string;

	const [game, setGame] = useState<Game | null>(null);
	const [isHost, setIsHost] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		// Fetch the game data when the component mounts
		const fetchGame = async () => {
			try {
				const response = await fetch(`/api/game/${gameCode}`);

				if (!response.ok) {
					throw new Error("Game not found");
				}

				const data = await response.json();
				setGame(data.game);

				// Check if the current user is the host
				// In a real app, you'd use authentication to identify the user
				// For this demo, we'll use localStorage to store the player ID
				const playerId = localStorage.getItem("playerId");
				if (
					playerId &&
					data.game.players.some((p: Player) => p.id === playerId && p.role === "host")
				) {
					setIsHost(true);
				}
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

		channel.bind("player-joined", (data: { player: Player; players: Player[] }) => {
			setGame((prevGame) => {
				if (!prevGame) return null;
				return {
					...prevGame,
					players: data.players,
				};
			});
		});

		channel.bind("game-started", (data: { game: Game }) => {
			setGame(data.game);
			router.push(`/game/${gameCode}`);
		});

		return () => {
			pusherClient.unsubscribe(`game-${gameCode}`);
		};
	}, [gameCode, router]);

	const handleStartGame = async () => {
		try {
			const response = await fetch(`/api/game/${gameCode}/start`, {
				method: "POST",
			});

			if (!response.ok) {
				throw new Error("Failed to start game");
			}

			// The redirect will happen via Pusher event
		} catch (error) {
			console.error("Error starting game:", error);
			setError("Failed to start game");
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
				<div className="text-center">
					<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
					<p className="mt-4 text-gray-700 dark:text-gray-300">Loading lobby...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
				<div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
					<h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
						Error
					</h1>
					<p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
					<button
						onClick={() => router.push("/")}
						className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
					>
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	if (!game) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
				<div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
					<h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
						Game Not Found
					</h1>
					<p className="text-gray-700 dark:text-gray-300 mb-6">
						The game you're looking for doesn't exist or has expired.
					</p>
					<button
						onClick={() => router.push("/")}
						className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
					>
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
			<div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
				<h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">
					Game Lobby
				</h1>

				<div className="mb-6">
					<div className="flex justify-between items-center mb-2">
						<h2 className="text-xl font-semibold text-gray-800 dark:text-white">
							Game Code
						</h2>
						<span className="px-3 py-1 bg-blue-100 text-blue-800 font-mono font-bold rounded-md dark:bg-blue-900 dark:text-blue-200">
							{gameCode}
						</span>
					</div>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Share this code with your friend to join the game
					</p>
				</div>

				<div className="mb-8">
					<h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
						Players
					</h2>
					<div className="space-y-3">
						{game.players.map((player, index) => (
							<div
								key={player.id + '-' + index}
								className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md"
							>
								<div className="flex items-center">
									<div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full mr-3">
										{index === 0 ? "X" : "O"}
									</div>
									<div>
										<p className="font-medium text-gray-800 dark:text-white">
											{player.name}
										</p>
										<span
											className={`text-xs ${
												player.role === "host"
													? "text-purple-600 dark:text-purple-400"
													: "text-green-600 dark:text-green-400"
											}`}
										>
											{player.role === "host" ? "Host" : "Guest"}
										</span>
									</div>
								</div>
								<div className="text-sm font-medium text-gray-600 dark:text-gray-300">
									Wins: {player.wins}
								</div>
							</div>
						))}

						{game.players.length < 2 && (
							<div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
								<div className="w-8 h-8 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full mr-3">
									?
								</div>
								<p className="text-gray-500 dark:text-gray-400">
									Waiting for player to join...
								</p>
							</div>
						)}
					</div>
				</div>

				{isHost && (
					<button
						onClick={handleStartGame}
						disabled={game.players.length < 2}
						className={`w-full px-4 py-3 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
							game.players.length < 2
								? "bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400"
								: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 dark:bg-blue-700 dark:hover:bg-blue-800"
						}`}
					>
						{game.players.length < 2 ? "Waiting for opponent..." : "Start Game"}
					</button>
				)}

				{!isHost && (
					<div className="text-center text-gray-600 dark:text-gray-400">
						{game.players.length < 2
							? "Waiting for another player to join..."
							: "Waiting for host to start the game..."}
					</div>
				)}
			</div>
		</div>
	);
}
