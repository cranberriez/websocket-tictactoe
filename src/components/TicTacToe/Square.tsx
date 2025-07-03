"use client";

import React from "react";

interface SquareProps {
	value: string | null;
	onClick: () => void;
	isWinning?: boolean;
}

const Square: React.FC<SquareProps> = ({ value, onClick, isWinning = false }) => {
	return (
		<button
			className={`square ${isWinning ? "winning" : ""} ${value ? "filled" : ""}`}
			onClick={onClick}
		>
			{value}
		</button>
	);
};

export default Square;
