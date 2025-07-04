import { NextResponse } from 'next/server';
import { getGame } from '@/lib/gameStore';
import { Game } from '@/types/game';

export async function GET(
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
    
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}
