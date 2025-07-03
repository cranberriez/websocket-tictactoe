"use client";

import React, { useState, useEffect } from "react";
import Board from "./Board";

interface GameProps {
	gameId?: string;
	playerId?: string;
	onlineMode?: boolean;
	onGameUpdate?: (squares: Array<string | null>, nextPlayer: string) => void;
	onGameEnd?: (winner: string | null) => void;
}

const Game: React.FC<GameProps> = ({
	gameId,
	playerId,
	onlineMode = false,
	onGameUpdate,
	onGameEnd,
}) => {
	const [history, setHistory] = useState<Array<{ squares: Array<string | null> }>>([
		{ squares: Array(9).fill(null) },
	]);
	const [stepNumber, setStepNumber] = useState(0);
	const [xIsNext, setXIsNext] = useState(true);
	const [winner, setWinner] = useState<string | null>(null);
	const [winningLine, setWinningLine] = useState<number[]>([]);
	const [status, setStatus] = useState("");

	useEffect(() => {
		const current = history[stepNumber];
		const result = calculateWinner(current.squares);

		if (result) {
			setWinner(result.winner);
			setWinningLine(result.line);
			setStatus(`Winner: ${result.winner}`);
			if (onGameEnd) onGameEnd(result.winner);
		} else if (current.squares.every((square) => square !== null)) {
			setStatus("Draw!");
			if (onGameEnd) onGameEnd(null);
		} else {
			setStatus(`Next player: ${xIsNext ? "X" : "O"}`);
		}
	}, [history, stepNumber, xIsNext, onGameEnd]);

	const handleClick = (i: number) => {
		const currentHistory = history.slice(0, stepNumber + 1);
		const current = currentHistory[currentHistory.length - 1];
		const squares = [...current.squares];

		// Return if the game is won or the square is already filled
		if (winner || squares[i]) return;

		// In online mode, only allow moves if it's the player's turn
		if (onlineMode && playerId) {
			const playerSymbol = playerId === gameId ? "X" : "O";
			if ((xIsNext && playerSymbol !== "X") || (!xIsNext && playerSymbol !== "O")) {
				return;
			}
		}

		squares[i] = xIsNext ? "X" : "O";

		setHistory([...currentHistory, { squares }]);
		setStepNumber(currentHistory.length);
		setXIsNext(!xIsNext);

		// Notify about game update for online mode
		if (onGameUpdate) {
			onGameUpdate(squares, xIsNext ? "O" : "X");
		}
	};

	const jumpTo = (step: number) => {
		setStepNumber(step);
		setXIsNext(step % 2 === 0);
	};

	const resetGame = () => {
		setHistory([{ squares: Array(9).fill(null) }]);
		setStepNumber(0);
		setXIsNext(true);
		setWinner(null);
		setWinningLine([]);
	};

	const current = history[stepNumber];

	const moves = history.map((_, move) => {
		const desc = move ? `Go to move #${move}` : "Go to game start";
		return (
			<li key={move}>
				<button
					onClick={() => jumpTo(move)}
					className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
				>
					{desc}
				</button>
			</li>
		);
	});

	return (
		<div className="game">
			<div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
				<div className="game-board-container">
					<div className="mb-4 text-lg font-medium">{status}</div>
					<Board
						squares={current.squares}
						onClick={handleClick}
						winningLine={winningLine}
					/>
					<button
						onClick={resetGame}
						className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
					>
						Reset Game
					</button>
				</div>

				{!onlineMode && (
					<div className="game-info">
						<h3 className="text-lg font-medium mb-2">History</h3>
						<ol className="space-y-2">{moves}</ol>
					</div>
				)}
			</div>
		</div>
	);
};

// Helper function to calculate winner
function calculateWinner(squares: Array<string | null>): { winner: string; line: number[] } | null {
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

export default Game;
