# Tic-Tac-Toe (Next.js + SQLite + Pusher)

A real-time, multiplayer Tic-Tac-Toe web app built with Next.js, TypeScript, SQLite, and Pusher. Play classic Tic-Tac-Toe with a friend by sharing a game code—no matchmaking or public lobbies. The app features persistent game state, real-time updates, and a clean UI.

## Features

-   Real-time multiplayer gameplay using Pusher
-   Persistent game state with SQLite
-   Simple game code sharing (no matchmaking)
-   Type-safe backend and frontend (TypeScript)
-   Modern Next.js app directory structure
-   Responsive and clean UI

## Tech Stack

-   **Frontend:** Next.js (React, TypeScript)
-   **Backend:** Next.js API routes
-   **Database:** SQLite (via better-sqlite3)
-   **Realtime:** Pusher

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the project root with your Pusher credentials:

```env
NEXT_PUBLIC_PUSHER_APP_KEY=your_pusher_app_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
PUSHER_APP_ID=your_pusher_app_id
PUSHER_SECRET=your_pusher_secret
```

### 3. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the app.

### 4. Database

The SQLite database file will be created automatically in the project root (if not present). No manual setup is required.

## Usage

-   Start a new game and share the code with a friend.
-   Both players join using the same code.
-   The game state updates in real-time for both players.
-   No matchmaking or public lobby system is included.

## Deployment

You can deploy this app to Vercel, Netlify, or any platform that supports Next.js. Make sure to set the same environment variables in your hosting provider.

## Environment Variables

| Name                       | Description             |
| -------------------------- | ----------------------- |
| NEXT_PUBLIC_PUSHER_APP_KEY | Pusher app key (public) |
| NEXT_PUBLIC_PUSHER_CLUSTER | Pusher cluster (public) |
| PUSHER_APP_ID              | Pusher app ID (server)  |
| PUSHER_SECRET              | Pusher secret (server)  |

## Contributing

Pull requests and issues are welcome!

## License

MIT
