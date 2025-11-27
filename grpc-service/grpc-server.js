import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend to get JWT_SECRET
dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });

const PROTO_PATH = path.join(__dirname, '../shared/proto/chat.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const chatProto = grpc.loadPackageDefinition(packageDefinition).chat;

/**
 * User Manager - handles user data and online status
 */
class UserManager {
  constructor() {
    // Map of userId -> User object
    this.users = new Map();
    // Map of userId -> gRPC call (stream)
    this.connections = new Map();
  }

  addUser(user, call) {
    this.users.set(user.id, { ...user, is_online: true });
    this.connections.set(user.id, call);
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (user) {
      user.is_online = false;
    }
    this.connections.delete(userId);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getConnection(userId) {
    return this.connections.get(userId);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getOnlineUsers() {
    return Array.from(this.users.values()).filter(u => u.is_online);
  }

  isOnline(userId) {
    return this.connections.has(userId);
  }

  broadcastToAll(message, excludeUserId = null) {
    for (const [userId, call] of this.connections) {
      if (userId !== excludeUserId) {
        try {
          call.write(message);
        } catch (err) {
          console.error(`Failed to send to user ${userId}:`, err.message);
        }
      }
    }
  }

  sendToUser(userId, message) {
    const call = this.connections.get(userId);
    if (call) {
      try {
        call.write(message);
        return true;
      } catch (err) {
        console.error(`Failed to send to user ${userId}:`, err.message);
        return false;
      }
    }
    return false;
  }
}

const userManager = new UserManager();

/**
 * Utility to generate unique message IDs
 */
function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Extract and verify user from JWT in metadata
 */
function getUserFromMetadata(call) {
  const metadata = call.metadata.getMap();
  const authHeader = metadata['authorization'];

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '');
    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        console.warn('JWT_SECRET not set in environment');
      } else {
        const decoded = jwt.verify(token, secret);
        return { 
          id: String(decoded.sub), 
          name: decoded.name || `User ${decoded.sub}`,
          is_online: true
        };
      }
    } catch (err) {
      console.error('JWT Verification failed:', err.message);
    }
  }

  // Fallback for development - allow user_id in metadata
  const userId = metadata['user_id'];
  const userName = metadata['user_name'];

  if (userId) {
    return { 
      id: String(userId), 
      name: userName || `User ${userId}`,
      is_online: true
    };
  }

  return null;
}

/**
 * ChatStream - Main persistent connection for receiving messages
 */
function chatStream(call) {
  const user = getUserFromMetadata(call);
  
  if (!user) {
    call.emit('error', {
      code: grpc.status.UNAUTHENTICATED,
      message: 'Authentication required'
    });
    return;
  }

  console.log(`User connected: ${user.name} (${user.id})`);

  // Register user connection
  userManager.addUser(user, call);

  // Send initial user list to the newly connected user
  const userListMessage = {
    user_list: {
      users: userManager.getAllUsers()
    }
  };
  call.write(userListMessage);

  // Broadcast presence update to all other users
  const presenceUpdate = {
    presence_update: {
      user: user,
      is_online: true,
      timestamp: Date.now()
    }
  };
  userManager.broadcastToAll(presenceUpdate, user.id);

  // Handle stream end
  call.on('end', () => {
    console.log(`User disconnected: ${user.name} (${user.id})`);
    userManager.removeUser(user.id);

    // Broadcast offline presence
    const offlineUpdate = {
      presence_update: {
        user: { ...user, is_online: false },
        is_online: false,
        timestamp: Date.now()
      }
    };
    userManager.broadcastToAll(offlineUpdate);

    call.end();
  });

  call.on('error', (err) => {
    if (err.code !== grpc.status.CANCELLED) {
      console.error(`Stream error for user ${user.id}:`, err.message);
    }
    userManager.removeUser(user.id);

    // Broadcast offline presence
    const offlineUpdate = {
      presence_update: {
        user: { ...user, is_online: false },
        is_online: false,
        timestamp: Date.now()
      }
    };
    userManager.broadcastToAll(offlineUpdate);
  });

  call.on('cancelled', () => {
    console.log(`Stream cancelled for user ${user.id}`);
    userManager.removeUser(user.id);

    const offlineUpdate = {
      presence_update: {
        user: { ...user, is_online: false },
        is_online: false,
        timestamp: Date.now()
      }
    };
    userManager.broadcastToAll(offlineUpdate);
  });
}

/**
 * SendMessage - Handle sending global or private messages
 */
function sendMessage(call, callback) {
  const user = getUserFromMetadata(call);
  
  if (!user) {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      message: 'Authentication required'
    });
    return;
  }

  const { text, recipient_id } = call.request;
  const messageId = generateMessageId();
  const timestamp = Date.now();

  if (recipient_id && recipient_id.trim() !== '') {
    // Private message
    const recipient = userManager.getUser(recipient_id);
    
    if (!recipient) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: 'Recipient not found'
      });
      return;
    }

    const privateMessage = {
      private_message: {
        id: messageId,
        sender: user,
        recipient: recipient,
        text: text,
        timestamp: timestamp
      }
    };

    // Send to recipient
    userManager.sendToUser(recipient_id, privateMessage);
    
    // Also send back to sender (so they see their own message)
    userManager.sendToUser(user.id, privateMessage);

    console.log(`Private message from ${user.name} to ${recipient.name}: ${text.substring(0, 50)}...`);
  } else {
    // Global message
    const globalMessage = {
      global_message: {
        id: messageId,
        sender: user,
        text: text,
        timestamp: timestamp
      }
    };

    // Broadcast to all connected users (including sender)
    userManager.broadcastToAll(globalMessage);

    console.log(`Global message from ${user.name}: ${text.substring(0, 50)}...`);
  }

  callback(null, { success: true, message_id: messageId });
}

/**
 * GetUsers - Get list of all users
 */
function getUsers(call, callback) {
  const user = getUserFromMetadata(call);
  
  if (!user) {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      message: 'Authentication required'
    });
    return;
  }

  const users = userManager.getAllUsers();
  callback(null, { users });
}

/**
 * SendTyping - Send typing indicator
 */
function sendTyping(call, callback) {
  const user = getUserFromMetadata(call);
  
  if (!user) {
    callback({
      code: grpc.status.UNAUTHENTICATED,
      message: 'Authentication required'
    });
    return;
  }

  const { context_id, is_typing } = call.request;
  const timestamp = Date.now();

  const typingEvent = {
    typing_event: {
      user: user,
      context_id: context_id,
      is_typing: is_typing,
      timestamp: timestamp
    }
  };

  if (context_id === 'global') {
    // Broadcast to all except sender
    userManager.broadcastToAll(typingEvent, user.id);
  } else {
    // Send only to the specific user (private chat context)
    userManager.sendToUser(context_id, typingEvent);
  }

  callback(null, {});
}

/**
 * Main server startup
 */
function main() {
  const server = new grpc.Server();
  
  server.addService(chatProto.ChatService.service, {
    ChatStream: chatStream,
    SendMessage: sendMessage,
    GetUsers: getUsers,
    SendTyping: sendTyping,
  });

  const PORT = process.env.GRPC_PORT || '50051';
  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) {
        console.error('Failed to start gRPC server:', err);
        return;
      }
      console.log(`Chat gRPC server running on port ${port}`);
    }
  );
}

main();
