import { NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { games } from '../../create/route';

export async function POST(
  request: Request,
  { params }: { params: { gameCode: string } }
) {
  try {
    const gameCode = params.gameCode;
    
    // Check if the game exists
    if (!games.has(gameCode)) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const game = games.get(gameCode);
    
    // Check if there are 2 players
    if (game.players.length < 2) {
      return NextResponse.json({ error: 'Need 2 players to start the game' }, { status: 400 });
    }
    
    // Update game status
    game.status = 'playing';
    
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
