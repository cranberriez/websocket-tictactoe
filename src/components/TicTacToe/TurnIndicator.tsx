"use client";

import { PlayerSymbol } from "@/types/game";

interface TurnIndicatorProps {
  currentPlayer: PlayerSymbol;
  yourSymbol: PlayerSymbol;
  isGameOver: boolean;
  winner: string | null;
}

const TurnIndicator: React.FC<TurnIndicatorProps> = ({ 
  currentPlayer, 
  yourSymbol, 
  isGameOver,
  winner
}) => {
  const isYourTurn = currentPlayer === yourSymbol && !isGameOver;
  
  // Generate appropriate message based on game state
  const getMessage = () => {
    if (isGameOver) {
      if (winner === "draw") {
        return "Game ended in a draw!";
      }
      return winner === yourSymbol ? "You won!" : "You lost!";
    }
    
    return isYourTurn ? "Your turn!" : "Waiting for opponent...";
  };
  
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4">
        {/* Symbol Indicator */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">You are playing as:</span>
          <span 
            className={`
              w-8 h-8 flex items-center justify-center rounded-full font-bold text-lg
              ${yourSymbol === 'X' 
                ? 'bg-red-500 text-white' 
                : 'bg-blue-500 text-white'}
            `}
          >
            {yourSymbol}
          </span>
        </div>
        
        {/* Turn Indicator */}
        <div 
          className={`
            p-4 rounded-md text-center font-medium transition-all
            ${isYourTurn && !isGameOver
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-l-4 border-green-500 animate-pulse'
              : isGameOver && winner === yourSymbol
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-l-4 border-yellow-500'
                : isGameOver && winner === "draw"
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-l-4 border-gray-500'
                  : isGameOver
                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-l-4 border-red-500'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200'
            }
          `}
        >
          {getMessage()}
        </div>
        
        {/* Current Turn */}
        {!isGameOver && (
          <div className="text-center text-sm">
            Current Turn: <span className={`font-bold ${currentPlayer === 'X' ? 'text-red-500' : 'text-blue-500'}`}>{currentPlayer}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TurnIndicator;
