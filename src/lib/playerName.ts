// Utilities to get/set/clear the player's name in localStorage

const PLAYER_NAME_KEY = "ttt_player_name";

export function getStoredPlayerName(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(PLAYER_NAME_KEY);
}

export function setStoredPlayerName(name: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(PLAYER_NAME_KEY, name);
}

export function clearStoredPlayerName(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(PLAYER_NAME_KEY);
}
