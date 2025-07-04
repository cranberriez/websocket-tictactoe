import { NextResponse } from 'next/server';
import { games } from '../create/route';

export async function GET(
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
    
    return NextResponse.json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}
