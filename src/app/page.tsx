"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [playerName, setPlayerName] = useState("Player");
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);
  const router = useRouter();

  const handleCreateGame = async () => {
    try {
      const response = await fetch('/api/game/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName }),
      });

      if (!response.ok) {
        throw new Error('Failed to create game');
      }

      const data = await response.json();
      router.push(`/lobby/${data.gameCode}`);
    } catch (error) {
      console.error('Error creating game:', error);
    }
  };

  const handleJoinGame = async () => {
    if (!joinCode) return;
    
    try {
      const response = await fetch('/api/game/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ playerName, gameCode: joinCode }),
      });

      if (!response.ok) {
        throw new Error('Failed to join game');
      }

      router.push(`/lobby/${joinCode}`);
    } catch (error) {
      console.error('Error joining game:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <main className="flex flex-col items-center gap-8 w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800 dark:text-white">Tic Tac Toe Online</h1>
        
        <div className="w-full">
          <label htmlFor="playerName" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Your Name
          </label>
          <input
            id="playerName"
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter your name"
          />
        </div>

        {showJoinInput ? (
          <div className="w-full">
            <label htmlFor="gameCode" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Game Code
            </label>
            <div className="flex gap-2">
              <input
                id="gameCode"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter 6-character code"
                maxLength={6}
              />
              <button
                onClick={handleJoinGame}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Join
              </button>
            </div>
            <button 
              onClick={() => setShowJoinInput(false)}
              className="mt-4 w-full text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col w-full gap-4">
            <button
              onClick={handleCreateGame}
              className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
            >
              Create Game
            </button>
            <button
              onClick={() => setShowJoinInput(true)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Join Game
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
