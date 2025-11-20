# WebSocket Server (Express + ws)

This project includes a small WebSocket server used for the real-time chat demo.

Quick run (PowerShell on Windows):

1. Install dependencies (from repository root):

```powershell
cd C:\Users\Afif\Documents\GitHub\uts_sem5
npm install
```

2. Start the WebSocket server:

```powershell
npm run server:start
```

3. Open the frontend (React app) dev server normally (`reactjs` folder). The chat connects to `ws://localhost:8080` by default.

Notes:
- The server file is at `server/websocket-server.js`.
- If you prefer auto-reload, install `nodemon` and use `npm run server:dev`.
- Later we can integrate message persistence into Laravel via a REST API endpoint; for now the server only broadcasts messages in memory.
