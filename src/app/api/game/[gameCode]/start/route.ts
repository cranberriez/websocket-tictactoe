import { NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { getGame, setGame } from '@/lib/gameStore';
import { Game } from '@/types/game';

export async function POST(
  request: Request,
  { params }: { params: { gameCode: string } }
) {
  try {
    // Await params to fix the dynamic route parameter bug
    const { gameCode } = await Promise.resolve(params);
    
    // Get the game from the centralized store
    const game = getGame(gameCode);
    
    // Check if the game exists
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    // Check if there are 2 players
    if (game.players.length < 2) {
      return NextResponse.json({ error: 'Need 2 players to start the game' }, { status: 400 });
    }
    
    // Update the game state in the centralized store
    game.status = 'playing';
    setGame(gameCode, game);
    
    // Randomly decide who goes first
    const firstPlayerIndex = Math.floor(Math.random() * 2);
    game.currentTurn = game.players[firstPlayerIndex].id;
    
    // Reset the board
    game.board = Array(9).fill(null);
    game.winner = null;
    
    // Trigger a Pusher event to notify all players that the game has started
    await pusher.trigger(`game-${gameCode}`, 'game-started', {
      game
    });
    
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error starting game:', error);
    return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
  }
}
