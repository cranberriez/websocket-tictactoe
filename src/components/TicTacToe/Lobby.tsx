"use client";

import React, { useState } from "react";
import { Player, PlayerRole } from "@/types/game";
import PlayerList from "./PlayerList";

interface LobbyProps {
	gameId: string;
	players: Player[];
	currentPlayerId: string;
	onStartGame: () => void;
	onJoinGame: (gameCode: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({
	gameId,
	players,
	currentPlayerId,
	onStartGame,
	onJoinGame,
}) => {
	const [joinInput, setJoinInput] = useState<string>("");
	const [error, setError] = useState<string>("");

	// Check if current player is host
	const isHost = players.find((p) => p.id === currentPlayerId)?.role === "host";

	// Check if there are both host and guest in the lobby
	const hasHost = players.some((p) => p.role === "host");
	const hasGuest = players.some((p) => p.role === "guest");
	const canStartGame = isHost && hasHost && hasGuest;

	// Handle join button click
	const handleJoinGame = () => {
		if (!joinInput) {
			setError("Please enter a game code");
			return;
		}
		onJoinGame(joinInput);
	};

	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
			{/* Mode: Create Game */}
			{gameId && (
				<>
					<div className="mb-6">
						<h2 className="text-2xl font-bold mb-2">Game Lobby</h2>
						<div className="bg-blue-100 dark:bg-blue-900 p-4 rounded flex items-center justify-between">
							<span>
								Game Code: <strong className="text-lg font-mono">{gameId}</strong>
							</span>
							<button
								onClick={() => navigator.clipboard.writeText(gameId)}
								className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
							>
								Copy
							</button>
						</div>
					</div>

					{/* Player List */}
					<PlayerList
						players={players}
						currentPlayerId={currentPlayerId}
					/>

					{/* Start Game Button - Only for host and only when both players are present */}
					{isHost && (
						<button
							onClick={onStartGame}
							disabled={!canStartGame}
							className={`w-full px-4 py-3 rounded font-medium transition
                ${
					canStartGame
						? "bg-green-500 text-white hover:bg-green-600"
						: "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
				}`}
						>
							{!hasGuest ? "Waiting for another player to join..." : "Start Game"}
						</button>
					)}

					{!isHost && (
						<div className="bg-gray-100 dark:bg-gray-700 rounded p-4 text-center">
							Waiting for host to start the game...
						</div>
					)}
				</>
			)}

			{/* Mode: Join Game */}
			{!gameId && (
				<div className="flex flex-col gap-4">
					<h2 className="text-2xl font-bold">Join Game</h2>
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
							maxLength={6}
							className="px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg tracking-wider uppercase"
							placeholder="ABCD12"
						/>
						{error && <p className="text-red-500 text-sm">{error}</p>}
					</div>
					<button
						type="button"
						onClick={handleJoinGame}
						className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
					>
						Join Game
					</button>
				</div>
			)}
		</div>
	);
};

export default Lobby;
