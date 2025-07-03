"use client";

import React from "react";
import Square from "./Square";

interface BoardProps {
	squares: Array<string | null>;
	onClick: (i: number) => void;
	winningLine?: number[];
}

const Board: React.FC<BoardProps> = ({ squares, onClick, winningLine = [] }) => {
	const renderSquare = (i: number) => {
		return (
			<Square
				value={squares[i]}
				onClick={() => onClick(i)}
				isWinning={winningLine.includes(i)}
			/>
		);
	};

	return (
		<div className="game-board">
			<div className="board-row">
				{renderSquare(0)}
				{renderSquare(1)}
				{renderSquare(2)}
			</div>
			<div className="board-row">
				{renderSquare(3)}
				{renderSquare(4)}
				{renderSquare(5)}
			</div>
			<div className="board-row">
				{renderSquare(6)}
				{renderSquare(7)}
				{renderSquare(8)}
			</div>
		</div>
	);
};

export default Board;
