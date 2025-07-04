export default function GameLoading() {
	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
			<div className="text-center">
				<div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
				<p className="mt-4 text-gray-700 dark:text-gray-300">Loading game...</p>
			</div>
		</div>
	);
}
