import { Player, Game } from "@/types/game";

interface LobbyViewProps {
  game: Game;
  gameCode: string;
  isHost: boolean;
  isLoading: boolean;
  error: string | null;
  onStartGame: () => void;
}

export default function LobbyView({ game, gameCode, isHost, isLoading, error, onStartGame }: LobbyViewProps) {
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
    return <div className="text-red-600 text-center">{error}</div>;
  }
  if (!game) {
    return <div className="text-red-600 text-center">Game not found.</div>;
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-6">Game Lobby</h1>
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Game Code</h2>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 font-mono font-bold rounded-md dark:bg-blue-900 dark:text-blue-200">{gameCode}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Share this code with your friend to join the game</p>
        </div>
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Players</h2>
          <div className="space-y-3">
            {Object.values(game.players).map((player: Player) => (
              <div key={player.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full mr-3">{player.symbol}</div>
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">{player.name}</p>
                    <span className={`text-xs ${player.role === "host" ? "text-purple-600 dark:text-purple-400" : "text-green-600 dark:text-green-400"}`}>{player.role === "host" ? "Host" : "Guest"}</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Wins: {player.wins}</div>
              </div>
            ))}
            {Object.values(game.players).length < 2 && (
              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="w-8 h-8 flex items-center justify-center bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 rounded-full mr-3">?</div>
                <p className="text-gray-500 dark:text-gray-400">Waiting for another player...</p>
              </div>
            )}
          </div>
        </div>
        {isHost && Object.values(game.players).length === 2 && (
          <button
            onClick={onStartGame}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  );
}
