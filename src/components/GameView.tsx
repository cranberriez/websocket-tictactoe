import { Player, Game } from "@/types/game";

interface GameViewProps {
  game: Game;
  playerId: string;
  gameResult: string | null;
  isMyTurn: boolean;
  isHost: boolean;
  opponent: Player | undefined;
  onMakeMove: (index: number) => void;
  onRestartGame: () => void;
}

export default function GameView({ game, playerId, gameResult, isMyTurn, isHost, opponent, onMakeMove, onRestartGame }: GameViewProps) {
  const currentPlayer: Player | undefined = playerId ? game.players[playerId] : undefined;
  const playerSymbol = currentPlayer?.symbol;
  const opponentSymbol = opponent?.symbol;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Tic Tac Toe</h1>
        <div className="flex justify-between items-center mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-blue-600 text-white font-bold rounded-full">{playerSymbol}</div>
            <p className="font-medium text-gray-800 dark:text-white">{currentPlayer?.name || "You"}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wins: {currentPlayer?.wins || 0}</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 mx-auto mb-2 bg-gray-400 text-white font-bold rounded-full">{opponentSymbol}</div>
            <p className="font-medium text-gray-800 dark:text-white">{opponent?.name || "Opponent"}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Wins: {opponent?.wins || 0}</p>
          </div>
        </div>
        {gameResult ? (
          <div className="mb-6 p-3 text-center bg-blue-100 dark:bg-blue-900 rounded-md">
            <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{gameResult}</p>
            {isHost && game.status === "finished" && (
              <button
                onClick={onRestartGame}
                className="mt-3 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Play Again
              </button>
            )}
            {!isHost && game.status === "finished" && (
              <p className="mt-3 text-sm text-blue-700 dark:text-blue-300">Waiting for host to restart the game...</p>
            )}
          </div>
        ) : (
          <div className="mb-6 p-3 text-center bg-blue-100 dark:bg-blue-900 rounded-md">
            <p className="text-lg font-medium text-blue-800 dark:text-blue-200">{isMyTurn ? "Your turn" : `${opponent?.name || "Opponent"}'s turn`}</p>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {game.board.map((cell, index) => (
            <button
              key={index}
              onClick={() => onMakeMove(index)}
              disabled={cell !== null || !isMyTurn || game.status === "finished"}
              className={`w-full aspect-square flex items-center justify-center text-3xl font-bold border-2 border-gray-300 dark:border-gray-600 rounded-md ${cell === "X" ? "text-blue-600" : cell === "O" ? "text-pink-600" : ""} ${cell !== null || !isMyTurn || game.status === "finished" ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed" : "bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-gray-600 cursor-pointer"}`}
            >
              {cell}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
