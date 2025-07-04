import { NextResponse } from 'next/server';
import { pusher } from '@/lib/pusher';
import { games } from '../create/route';

export async function POST(request: Request) {
  try {
    const { playerName, gameCode } = await request.json();
    
    // Check if the game exists
    if (!games.has(gameCode)) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const game = games.get(gameCode);
    
    // Check if the game is already full
    if (game.players.length >= 2) {
      return NextResponse.json({ error: 'Game is already full' }, { status: 400 });
    }
    
    // Add the player to the game
    const newPlayer = {
      id: Date.now().toString(), // Simple ID for demo purposes
      name: playerName,
      role: 'guest',
      wins: 0
    };
    
    game.players.push(newPlayer);
    
    // Trigger a Pusher event to notify the host that a player has joined
    await pusher.trigger(`game-${gameCode}`, 'player-joined', {
      player: newPlayer,
      players: game.players
    });
    
    return NextResponse.json({ success: true, game });
  } catch (error) {
    console.error('Error joining game:', error);
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}
