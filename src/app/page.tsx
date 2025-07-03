import Game from "@/components/TicTacToe/Game";

export default function Home() {
	return (
		<div className="min-h-screen flex flex-col items-center p-8">
			<header className="mb-8 text-center">
				<h1 className="text-4xl font-bold mb-2">Tic Tac Toe</h1>
				<p className="text-gray-600 dark:text-gray-400">
					A real-time multiplayer game using Next.js and WebSockets
				</p>
			</header>

			<main className="flex-1 w-full max-w-4xl">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
					{/* Local Game Mode */}
					<div className="mb-8">
						<h2 className="text-2xl font-bold mb-4">Play Locally</h2>
						<Game />
					</div>

					{/* Online Game Mode - Will be implemented with WebSockets */}
					<div className="border-t border-gray-200 dark:border-gray-700 pt-8">
						<h2 className="text-2xl font-bold mb-4">Play Online</h2>
						<p className="mb-4 text-gray-600 dark:text-gray-400">
							Online multiplayer mode coming soon! This will use WebSockets for
							real-time gameplay.
						</p>
						<div className="flex gap-4">
							<button
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition opacity-50 cursor-not-allowed"
								disabled
							>
								Create Game
							</button>
							<button
								className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition opacity-50 cursor-not-allowed"
								disabled
							>
								Join Game
							</button>
						</div>
					</div>
				</div>
			</main>

			<footer className="mt-8 text-center text-gray-500 text-sm">
				<p>Built with Next.js, TypeScript, and WebSockets</p>
			</footer>
		</div>
	);
}
