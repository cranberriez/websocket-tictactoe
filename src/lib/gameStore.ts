import { Game } from "@/types/game";
import {
	getGame as getTursoGame,
	getGames as getTursoGames,
	saveGame as saveTursoGame,
	deleteGame as deleteTursoGame,
} from "./tursoGameStore";

export async function getGames(): Promise<Game[]> {
	return await getTursoGames();
}

export async function getGame(gameCode: string): Promise<Game | undefined> {
	return await getTursoGame(gameCode);
}

export async function setGame(gameCode: string, game: Game): Promise<void> {
	await saveTursoGame(game);
}

export async function deleteGame(gameCode: string): Promise<void> {
	await deleteTursoGame(gameCode);
}
