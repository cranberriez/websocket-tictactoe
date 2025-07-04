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
    
    // Check if the game is finished
    if (game.status !== 'finished') {
      return NextResponse.json({ error: 'Game is not finished yet' }, { status: 400 });
    }
    
    // Reset the game
    game.status = 'playing';
    game.board = Array(9).fill(null);
    game.winner = null;
    
    // Randomly decide who goes first
    const firstPlayerIndex = Math.floor(Math.random() * 2);
    game.currentTurn = game.players[firstPlayerIndex].id;
    
    // Trigger a Pusher event to notify all players that the game has been restarted
    await pusher.trigger(`game-${gameCode}`, 'game-restarted', {
      game
    });
    
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error restarting game:', error);
    return NextResponse.json({ error: 'Failed to restart game' }, { status: 500 });
  }
}
