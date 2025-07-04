"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { pusherClient } from "@/lib/pusher";
import { ensurePlayerId } from "@/lib/playerId";
import { Game, Player } from "@/types/game";
import GameLoading from "@/components/GameLoading";
import GameError from "@/components/GameError";
import GameNotFound from "@/components/GameNotFound";
import LobbyView from "@/components/LobbyView";
import GameView from "@/components/GameView";

export default function RoomPage() {
	const params = useParams();
	const gameCode = params.gameCode as string;

	const [game, setGame] = useState<Game | null>(null);
	const [playerId, setPlayerId] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [gameResult, setGameResult] = useState<string | null>(null);
	const [isHost, setIsHost] = useState(false);

	// Fetch and subscribe logic
	useEffect(() => {
		const storedPlayerId = ensurePlayerId();
		setPlayerId(storedPlayerId);

		const fetchGame = async () => {
			try {
				const response = await fetch(`/api/game/${gameCode}`);
				if (!response.ok) throw new Error("Game not found");
				const data = await response.json();
				setGame(data.game);
				// Host check
				if (
					storedPlayerId &&
					(Object.values(data.game.players) as Player[]).some(
						(p) => p.id === storedPlayerId && p.role === "host"
					)
				) {
					setIsHost(true);
				}
			} catch (error) {
				setError("Game not found or has expired");
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchGame();

		const channel = pusherClient.subscribe(`game-${gameCode}`);

		channel.bind(
			"player-joined",
			(data: { player: Player; players: { [id: string]: Player } }) => {
				setGame((prevGame) => {
					if (!prevGame) return null;
					return {
						...prevGame,
						players: data.players,
					};
				});
			}
		);

		channel.bind("game-started", (data: { game: Game }) => {
			setGame(data.game);
		});

		channel.bind("move-made", (data: { game: Game }) => {
			setGame(data.game);
			if (data.game.status === "finished") {
				if (data.game.winner) {
					const winner = data.game.players[storedPlayerId as string];
					if (winner) setGameResult(`${winner.name} wins!`);
				} else {
					setGameResult("It's a tie!");
				}
			}
		});

		channel.bind("game-restarted", (data: { game: Game }) => {
			setGame(data.game);
			setGameResult(null);
		});

		return () => {
			pusherClient.unsubscribe(`game-${gameCode}`);
		};
	}, [gameCode]);

	// Handlers
	const handleStartGame = async () => {
		try {
			const response = await fetch(`/api/game/${gameCode}/start`, { method: "POST" });
			if (!response.ok) throw new Error("Failed to start game");
		} catch (error) {
			console.error("Error starting game:", error);
			setError("Failed to start game");
		}
	};

	const handleMakeMove = async (index: number) => {
		if (!game || game.currentTurn !== playerId || game.board[index] !== null) return;
		try {
			const response = await fetch(`/api/game/${gameCode}/move`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ playerId, position: index }),
			});
			if (!response.ok) throw new Error("Failed to make move");
		} catch (error) {
			console.error("Error making move:", error);
			setError("Failed to make move");
		}
	};

	const handleRestartGame = async () => {
		if (!isHost) return;
		try {
			const response = await fetch(`/api/game/${gameCode}/restart`, { method: "POST" });
			if (!response.ok) throw new Error("Failed to restart game");
		} catch (error) {
			console.error("Error restarting game:", error);
			setError("Failed to restart game");
		}
	};

	// Derived values
	const opponent: Player | undefined = game
		? Object.values(game.players as { [id: string]: Player }).find(
				(p: Player) => p.id !== playerId
		  )
		: undefined;
	const isMyTurn = game && playerId ? game.currentTurn === playerId : false;

	// Render logic
	if (isLoading) return <GameLoading />;
	if (error) return <GameError error={error} />;
	if (!game) return <GameNotFound />;

	if (game.status === "waiting") {
		return (
			<LobbyView
				game={game}
				gameCode={gameCode}
				isHost={isHost}
				isLoading={isLoading}
				error={error}
				onStartGame={handleStartGame}
			/>
		);
	}

	return (
		<GameView
			game={game}
			playerId={playerId as string}
			gameResult={gameResult}
			isMyTurn={isMyTurn}
			isHost={isHost}
			opponent={opponent}
			onMakeMove={handleMakeMove}
			onRestartGame={handleRestartGame}
		/>
	);
}
