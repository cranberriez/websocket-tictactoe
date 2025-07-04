// Utility for getting and setting playerId in localStorage

export function getPlayerId(): string | null {
	if (typeof window === "undefined") return null;
	{
		console.log("[GET] Player ID:", localStorage.getItem("playerId"));
		return localStorage.getItem("playerId");
	}
}

export function setPlayerId(id: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem("playerId", id);
	console.log("[SET] Player ID:", id);
}

export function ensurePlayerId(): string {
	if (typeof window === "undefined") return "";
	let playerId = localStorage.getItem("playerId");
	if (!playerId) {
		if ("randomUUID" in crypto) {
			playerId = crypto.randomUUID();
		} else {
			playerId = Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
		}
		localStorage.setItem("playerId", playerId);
	}
	console.log("[ENSURE] Player ID:", playerId);
	return playerId;
}

export function clearPlayerId(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem("playerId");
	console.log("[CLEAR] Player ID");
}
