import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';

const app = express();
const server = createServer(app);

app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Express WebSocket Demo</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    #messages { border: 1px solid #ccc; height: 300px; 
                               overflow-y: scroll; padding: 10px; margin-bottom: 10px; }
                    #messageInput { width: 300px; padding: 5px; }
                    button { padding: 5px 10px; }
                </style>
            </head>
            <body>
                <h1>Express WebSocket Demo</h1>
                <div id="messages"></div>
                <input type="text" id="messageInput" placeholder="Enter your message">
                <button onclick="sendMessage()">Send Message</button>
                <script>
                    const ws = new WebSocket('ws://localhost:${PORT}');
                    const messages = document.getElementById('messages');

                    ws.onmessage = function(event) {
                        const messageDiv = document.createElement('div');
                        messageDiv.textContent = event.data;
                        messages.appendChild(messageDiv);
                        messages.scrollTop = messages.scrollHeight;
                    };

                    function sendMessage() {
                        const input = document.getElementById('messageInput');
                        if (input.value) {
                            ws.send(input.value);
                            input.value = '';
                        }
                    }

                    document.getElementById('messageInput').addEventListener('keypress', function(e) {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });
                </script>
            </body>
        </html>
    `);
});

class ConnectionManager {
    constructor() {
        this.clients = new Map();
    }

    addClient(ws, userName) {
        this.clients.set(ws, { userName, connectedAt: new Date() });
        console.log(`Client added: ${userName}. Total clients: ${this.clients.size}`);
    }

    removeClient(ws) {
        const clientData = this.clients.get(ws);
        if (clientData) {
            console.log(`Client removed: ${clientData.userName}. Total clients: ${this.clients.size - 1}`);
        }
        this.clients.delete(ws);
    }

    getClientName(ws) {
        const clientData = this.clients.get(ws);
        return clientData ? clientData.userName : 'Unknown';
    }

    // Menyebarkan pesan ke semua klien lain kecuali pengirim untuk menjaga percakapan tetap sinkron
    broadcast(message, sender = null) {
        this.clients.forEach((clientData, client) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                try {
                    client.send(message);
                } catch (error) {
                    console.error('Error broadcasting to client:', error);
                    this.removeClient(client);
                }
            }
        });
    }

    getClientCount() {
        return this.clients.size;
    }
}

const connectionManager = new ConnectionManager();

const wss = new WebSocketServer({ 
    server,
    clientTracking: true
});

wss.on('connection', function connection(ws, request) {
    const clientIP = request.socket.remoteAddress;
    console.log(`New client connected from ${clientIP}`);

    let userName = null;

    ws.on('message', function message(data) {
        try {
            const messageText = data.toString();
            
            // Check if this is a username message
            try {
                const parsedData = JSON.parse(messageText);
                if (parsedData.type === 'username') {
                    userName = parsedData.name;
                    connectionManager.addClient(ws, userName);
                    ws.send(`Welcome to the WebSocket server, ${userName}!`);
                    connectionManager.broadcast(`${userName} joined the chat.`, ws);
                    return;
                }
            } catch (e) {
                // Not JSON, treat as regular message
            }

            // Regular message
            if (userName && ws.readyState === WebSocket.OPEN) {
                console.log(`[${userName}] Received:`, messageText);
                connectionManager.broadcast(`${userName}: ${messageText}`, ws);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', function close(code, reason) {
        if (userName) {
            connectionManager.broadcast(`${userName} left the chat.`);
            connectionManager.removeClient(ws);
            console.log(`[${userName}] Client disconnected - Code: ${code}, Reason: ${reason}`);
        }
    });

    ws.on('error', function error(err) {
        console.error('WebSocket error:', err);
    });

    ws.on('pong', function heartbeat() {
        ws.isAlive = true;
    });

    ws.isAlive = true;
});

// Ping clients periodically to detect broken connections
// Komentar: mekanisme heartbeat ini memastikan koneksi mati terputus otomatis agar server tetap bersih
const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
        if (ws.isAlive === false) {
            return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
    });
}, 3000);

wss.on('close', function close() {
    clearInterval(interval);
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
