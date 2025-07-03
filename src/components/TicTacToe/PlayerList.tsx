"use client";

import { Player } from "@/types/game";

interface PlayerListProps {
  players: Player[];
  currentPlayerId: string;
}

const PlayerList: React.FC<PlayerListProps> = ({ players, currentPlayerId }) => {
  // Helper function to render player label
  const getPlayerLabel = (player: Player) => {
    const roleLabel = player.role === "host" ? "Host" : "Guest";
    const youLabel = player.id === currentPlayerId ? "You" : "Other";
    
    return `(${roleLabel}) ${youLabel}`;
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Players</h3>
      <div className="flex flex-col gap-2">
        {players.map((player) => (
          <div 
            key={player.id} 
            className={`
              p-3 rounded-md flex justify-between items-center
              ${player.id === currentPlayerId 
                ? 'bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500' 
                : 'bg-gray-100 dark:bg-gray-800'}
            `}
          >
            <div className="flex items-center gap-2">
              <span 
                className={`
                  w-6 h-6 flex items-center justify-center rounded-full 
                  ${player.symbol === 'X' 
                    ? 'bg-red-500 text-white' 
                    : 'bg-blue-500 text-white'}
                `}
              >
                {player.symbol}
              </span>
              <span className="font-medium">{getPlayerLabel(player)}</span>
            </div>
            {player.symbol === (players.find(p => p.id === currentPlayerId)?.symbol) && (
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 py-1 px-2 rounded">
                Same team
              </span>
            )}
          </div>
        ))}
        
        {players.length < 2 && (
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-dashed border-gray-300 dark:border-gray-600 text-center text-gray-500 dark:text-gray-400">
            Waiting for another player to join...
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerList;
