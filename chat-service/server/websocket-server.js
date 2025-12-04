import express from 'express';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend to get JWT_SECRET
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const app = express();
const server = createServer(app);

app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  const userManager = req.app.get('userManager');
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'websocket-service',
    connections: userManager ? userManager.users.size : 0,
  });
});

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.warn(
    '⚠️  JWT_SECRET not found in environment. JWT verification will be skipped (dev mode).'
  );
}

/**
 * UserManager - Mengelola semua user yang terkoneksi
 * Menyimpan informasi user dan websocket untuk broadcast ke user yang tepat
 */
class UserManager {
  constructor() {
    // Map userId -> { ws, user: { id, name, isOnline } }
    this.users = new Map();
    // Map ws -> userId (untuk lookup cepat saat disconnect)
    this.socketToUser = new Map();
  }

  /**
   * Autentikasi dan registrasi user
   */
  addUser(ws, userId, userName) {
    // Hapus koneksi lama jika ada (user reconnect)
    const existing = this.users.get(userId);
    if (existing && existing.ws !== ws) {
      console.log(`User ${userName} reconnecting, closing old connection`);
      try {
        existing.ws.close(1000, 'Replaced by new connection');
      } catch (e) {
        // ignore
      }
    }

    const user = {
      id: userId,
      name: userName,
      isOnline: true,
    };

    this.users.set(userId, { ws, user });
    this.socketToUser.set(ws, userId);

    console.log(
      `User ${userName} (${userId}) connected. Total users: ${this.users.size}`
    );
    return user;
  }

  /**
   * Hapus user saat disconnect
   */
  removeUser(ws) {
    const userId = this.socketToUser.get(ws);
    if (!userId) return null;

    const userData = this.users.get(userId);
    if (userData && userData.ws === ws) {
      this.users.delete(userId);
      console.log(
        `User ${userData.user.name} (${userId}) disconnected. Total users: ${this.users.size}`
      );
      this.socketToUser.delete(ws);
      return userData.user;
    }

    this.socketToUser.delete(ws);
    return null;
  }

  /**
   * Dapatkan user berdasarkan userId
   */
  getUser(userId) {
    const userData = this.users.get(userId);
    return userData ? userData.user : null;
  }

  /**
   * Dapatkan user berdasarkan websocket
   */
  getUserBySocket(ws) {
    const userId = this.socketToUser.get(ws);
    return userId ? this.getUser(userId) : null;
  }

  /**
   * Dapatkan list semua user online
   */
  getAllUsers() {
    return Array.from(this.users.values()).map(({ user }) => user);
  }

  /**
   * Dapatkan list user online kecuali user tertentu
   */
  getOtherUsers(excludeUserId) {
    return this.getAllUsers().filter((u) => u.id !== excludeUserId);
  }

  /**
   * Broadcast ke semua user
   */
  broadcast(message, excludeUserId = null) {
    const data =
      typeof message === 'string' ? message : JSON.stringify(message);

    this.users.forEach(({ ws, user }) => {
      if (excludeUserId && user.id === excludeUserId) return;
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(data);
        } catch (e) {
          console.error(`Error broadcasting to ${user.name}:`, e);
        }
      }
    });
  }

  /**
   * Kirim ke user tertentu
   */
  sendToUser(userId, message) {
    const userData = this.users.get(userId);
    if (userData && userData.ws.readyState === WebSocket.OPEN) {
      try {
        const data =
          typeof message === 'string' ? message : JSON.stringify(message);
        userData.ws.send(data);
        return true;
      } catch (e) {
        console.error(`Error sending to ${userId}:`, e);
      }
    }
    return false;
  }

  /**
   * Kirim ke websocket tertentu
   */
  sendToSocket(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        const data =
          typeof message === 'string' ? message : JSON.stringify(message);
        ws.send(data);
        return true;
      } catch (e) {
        console.error('Error sending to socket:', e);
      }
    }
    return false;
  }
}

const userManager = new UserManager();

/**
 * Generate unique message ID
 */
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Simple HTML test page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>WebSocket Chat Server</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
        </style>
      </head>
      <body>
        <h1>WebSocket Chat Server</h1>
        <p>Server is running on port ${PORT}</p>
        <p>Connected users: <span id="count">Loading...</span></p>
        <script>
          const ws = new WebSocket('ws://localhost:${PORT}');
          ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.type === 'user_list') {
              document.getElementById('count').textContent = data.users.length;
            }
          };
          ws.onopen = () => ws.send(JSON.stringify({ type: 'get_users' }));
        </script>
      </body>
    </html>
  `);
});

const wss = new WebSocketServer({ server, clientTracking: true });

wss.on('connection', function connection(ws, request) {
  const clientIP = request.socket.remoteAddress;
  console.log(`New client connected from ${clientIP}`);

  let isAuthenticated = false;

  ws.on('message', function message(data) {
    try {
      const messageText = data.toString();
      let parsed;

      try {
        parsed = JSON.parse(messageText);
      } catch (e) {
        console.log('Non-JSON message received, ignoring');
        return;
      }

      // Handle auth message
      if (parsed.type === 'auth') {
        const { userId, userName, token } = parsed;

        if (!userId || !userName) {
          userManager.sendToSocket(ws, {
            type: 'error',
            message: 'userId and userName required for authentication',
          });
          return;
        }

        // Verify JWT token if JWT_SECRET is configured
        if (JWT_SECRET && token) {
          try {
            const decoded = jwt.verify(token, JWT_SECRET);
            // Optionally verify that the token's sub matches the userId
            if (String(decoded.sub) !== String(userId)) {
              console.warn(
                `Token sub (${decoded.sub}) does not match userId (${userId})`
              );
              userManager.sendToSocket(ws, {
                type: 'error',
                message: 'Token user mismatch',
              });
              return;
            }
            console.log(`JWT verified for user ${userName} (${userId})`);
          } catch (err) {
            console.warn(
              `JWT verification failed for ${userName}: ${err.message}`
            );
            userManager.sendToSocket(ws, {
              type: 'error',
              message: 'Invalid or expired token',
            });
            return;
          }
        } else if (JWT_SECRET && !token) {
          // JWT_SECRET is set but no token provided - reject in production
          console.warn(
            `No token provided for ${userName}, but JWT_SECRET is set`
          );
          // Allow for now with warning (remove this in production)
          console.warn('⚠️  Allowing unauthenticated connection (dev mode)');
        }

        // Register user
        const user = userManager.addUser(ws, userId, userName);
        isAuthenticated = true;

        // Kirim konfirmasi auth dengan list user lain
        userManager.sendToSocket(ws, {
          type: 'auth_success',
          users: userManager.getOtherUsers(userId),
        });

        // Broadcast presence ke user lain
        userManager.broadcast(
          {
            type: 'presence',
            user: user,
            isOnline: true,
            timestamp: Date.now(),
          },
          userId
        );

        return;
      }

      // Semua pesan lain butuh autentikasi
      if (!isAuthenticated) {
        userManager.sendToSocket(ws, {
          type: 'error',
          message: 'Not authenticated. Send auth message first.',
        });
        return;
      }

      const sender = userManager.getUserBySocket(ws);
      if (!sender) {
        userManager.sendToSocket(ws, {
          type: 'error',
          message: 'User session not found',
        });
        return;
      }

      // Handle message
      if (parsed.type === 'message') {
        const messageId = parsed.id || generateMessageId();
        const { text, recipientId } = parsed;

        if (!text || !text.trim()) {
          return;
        }

        if (recipientId) {
          // Private message
          const recipient = userManager.getUser(recipientId);
          if (!recipient) {
            userManager.sendToSocket(ws, {
              type: 'error',
              message: 'Recipient not found or offline',
            });
            return;
          }

          const privateMessage = {
            type: 'private_message',
            id: messageId,
            sender: sender,
            recipient: recipient,
            text: text.trim(),
            timestamp: Date.now(),
          };

          // Kirim ke recipient
          userManager.sendToUser(recipientId, privateMessage);

          // Kirim juga ke sender (echo back)
          userManager.sendToSocket(ws, privateMessage);

          console.log(
            `Private message from ${sender.name} to ${recipient.name}: ${text.trim()}`
          );
        } else {
          // Global message - broadcast ke semua
          const globalMessage = {
            type: 'global_message',
            id: messageId,
            sender: sender,
            text: text.trim(),
            timestamp: Date.now(),
          };

          // Broadcast ke semua termasuk sender
          userManager.broadcast(globalMessage);

          console.log(`Global message from ${sender.name}: ${text.trim()}`);
        }

        // Konfirmasi message terkirim
        userManager.sendToSocket(ws, {
          type: 'message_sent',
          success: true,
          messageId: messageId,
        });

        return;
      }

      // Handle typing indicator
      if (parsed.type === 'typing') {
        const { contextId, isTyping } = parsed;

        if (contextId && contextId !== 'global') {
          // Private typing - kirim ke user tertentu
          // contextId dari sender adalah recipientId
          // Tapi untuk recipient, contextId harus sender.id agar match dengan conversation mereka
          const typingEvent = {
            type: 'typing',
            user: sender,
            contextId: sender.id, // Gunakan sender.id agar recipient bisa match conversation
            isTyping: !!isTyping,
            timestamp: Date.now(),
          };
          userManager.sendToUser(contextId, typingEvent);
        } else {
          // Global typing - broadcast ke semua kecuali sender
          const typingEvent = {
            type: 'typing',
            user: sender,
            contextId: 'global',
            isTyping: !!isTyping,
            timestamp: Date.now(),
          };
          userManager.broadcast(typingEvent, sender.id);
        }

        return;
      }

      // Handle get_users request
      if (parsed.type === 'get_users') {
        userManager.sendToSocket(ws, {
          type: 'user_list',
          users: userManager.getOtherUsers(sender.id),
        });
        return;
      }

      console.log(`Unknown message type: ${parsed.type}`);
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', function close(code, _reason) {
    const user = userManager.removeUser(ws);
    if (user) {
      // Broadcast presence update ke semua user yang tersisa
      userManager.broadcast({
        type: 'presence',
        user: user,
        isOnline: false,
        timestamp: Date.now(),
      });
      console.log(`User ${user.name} disconnected - Code: ${code}`);
    }
  });

  ws.on('error', function error(err) {
    console.error('WebSocket error:', err);
    userManager.removeUser(ws);
  });

  ws.on('pong', function heartbeat() {
    ws.isAlive = true;
  });

  ws.isAlive = true;
});

// Ping clients periodically untuk deteksi koneksi mati
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    // Skip clients yang sudah tidak authenticated
    if (!userManager.getUserBySocket(ws)) {
      return;
    }

    if (ws.isAlive === false) {
      userManager.removeUser(ws);
      return ws.terminate();
    }

    ws.isAlive = false;
    try {
      ws.ping();
    } catch (e) {
      // Ignore ping errors
      console.debug('Ping error:', e.message);
    }
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});

// Store userManager in app for health check
app.set('userManager', userManager);

server.listen(PORT, () => {
  console.log(`WebSocket Chat Server running on http://localhost:${PORT}`);
});
