"use client";

import { useRouter } from "next/navigation";

export default function GameNotFound() {
	const router = useRouter();
	return (
		<div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
			<div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center">
				<h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
					Game Not Found
				</h1>
				<p className="text-gray-700 dark:text-gray-300 mb-6">
					The game you&apos;re looking for doesn&apos;t exist or has expired.
				</p>
				<button
					onClick={() => router.push("/")}
					className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-700 dark:hover:bg-blue-800"
				>
					Back to Home
				</button>
			</div>
		</div>
	);
}
