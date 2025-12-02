import { getAuthToken, getAuthUser } from './authService';

/**
 * Chat Service menggunakan WebSocket (lebih sederhana dari gRPC, tidak perlu Envoy proxy)
 *
 * Protocol Pesan (JSON):
 * - Client -> Server:
 *   { type: 'auth', userId: string, userName: string, token: string }
 *   { type: 'message', text: string, recipientId?: string }
 *   { type: 'typing', contextId: string, isTyping: boolean }
 *   { type: 'get_users' }
 *
 * - Server -> Client:
 *   { type: 'auth_success', users: User[] }
 *   { type: 'global_message', id, sender, text, timestamp }
 *   { type: 'private_message', id, sender, recipient, text, timestamp }
 *   { type: 'presence', user, isOnline, timestamp }
 *   { type: 'typing', user, contextId, isTyping, timestamp }
 *   { type: 'user_list', users: User[] }
 *   { type: 'message_sent', success, messageId }
 */

// Configuration
const WS_HOST = import.meta.env.VITE_WS_HOST || 'ws://localhost:8080';

let ws = null;
let reconnectAttempts = 0;
let reconnectTimer = null;
let isIntentionalClose = false;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

// Event handlers storage
let eventHandlers = {};

/**
 * Generate unique message ID
 */
function generateMessageId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Chat Service - handles all chat-related operations via WebSocket
 */
export const chatService = {
  /**
   * Start the chat stream to receive messages
   * @param {Object} handlers - Event handlers
   * @param {Function} handlers.onGlobalMessage - Called when a global message is received
   * @param {Function} handlers.onPrivateMessage - Called when a private message is received
   * @param {Function} handlers.onPresenceUpdate - Called when a user goes online/offline
   * @param {Function} handlers.onTypingEvent - Called when someone is typing
   * @param {Function} handlers.onUserList - Called with initial user list
   * @param {Function} handlers.onError - Called on error
   * @param {Function} handlers.onEnd - Called when stream ends
   * @returns {Promise<Object>} Stream control object with cancel method
   */
  async startChatStream(handlers = {}) {
    // Cancel any pending reconnect
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    // Debounce connection: if connected recently, wait
    if (ws && ws.readyState === WebSocket.CONNECTING) {
      console.log('Connection already in progress...');
      return { cancel: () => {} };
    }

    // Cancel existing connection if any
    if (ws) {
      isIntentionalClose = true;
      try {
        ws.close(1000, 'New connection requested');
      } catch (e) {
        // ignore
      }
      ws = null;
    }

    isIntentionalClose = false;
    eventHandlers = handlers;
    const user = getAuthUser();
    const token = getAuthToken();

    if (!user) {
      console.error('User not authenticated');
      handlers.onError?.(new Error('User not authenticated'));
      return null;
    }

    return new Promise((resolve) => {
      try {
        const connectionId = Date.now();
        console.log(`[${connectionId}] Connecting to WebSocket at:`, WS_HOST);
        const socket = new WebSocket(WS_HOST);
        ws = socket;
        socket.connectionId = connectionId;

        socket.onopen = () => {
          // Pastikan ini masih socket yang aktif
          if (ws !== socket) {
            console.log(`[${connectionId}] Socket replaced, ignoring onopen`);
            return;
          }

          console.log(`[${connectionId}] WebSocket connected, sending auth...`);
          reconnectAttempts = 0;

          // Kirim autentikasi saat koneksi terbuka
          const authMessage = {
            type: 'auth',
            userId: String(user.id),
            userName: user.name,
            token: token || '',
          };
          socket.send(JSON.stringify(authMessage));
        };

        socket.onmessage = (event) => {
          if (ws !== socket) return;
          try {
            const data = JSON.parse(event.data);
            chatService._handleServerMessage(data);
          } catch (e) {
            console.warn(`[${connectionId}] Failed to parse WebSocket message:`, event.data);
          }
        };

        socket.onerror = (error) => {
          if (ws !== socket) return;
          console.error(`[${connectionId}] WebSocket error:`, error);
          handlers.onError?.(new Error('WebSocket connection error'));
        };

        socket.onclose = (event) => {
          if (ws !== socket) {
            console.log(`[${connectionId}] Old socket closed, ignoring`);
            return;
          }

          console.log(`[${connectionId}] WebSocket closed:`, event.code, event.reason);
          ws = null;
          handlers.onEnd?.();

          // Auto-reconnect jika bukan intentional close
          if (
            !isIntentionalClose &&
            event.code !== 1000 &&
            reconnectAttempts < MAX_RECONNECT_ATTEMPTS
          ) {
            reconnectAttempts++;
            console.log(`Reconnecting in ${RECONNECT_DELAY}ms (attempt ${reconnectAttempts})...`);
            reconnectTimer = setTimeout(() => {
              reconnectTimer = null;
              chatService.startChatStream(handlers);
            }, RECONNECT_DELAY);
          }
        };

        resolve({ cancel: () => chatService.endChatStream() });
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
        handlers.onError?.(err);
        resolve(null);
      }
    });
  },

  /**
   * Handle incoming server messages
   * @private
   */
  _handleServerMessage(data) {
    switch (data.type) {
      case 'auth_success':
        console.log('Auth successful, received user list');
        eventHandlers.onUserList?.(data.users || []);
        break;

      case 'global_message':
        eventHandlers.onGlobalMessage?.({
          id: data.id,
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });
        break;

      case 'private_message':
        eventHandlers.onPrivateMessage?.({
          id: data.id,
          sender: data.sender,
          recipient: data.recipient,
          text: data.text,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });
        break;

      case 'presence':
        eventHandlers.onPresenceUpdate?.({
          user: data.user,
          isOnline: data.isOnline,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });
        break;

      case 'typing':
        eventHandlers.onTypingEvent?.({
          user: data.user,
          contextId: data.contextId,
          isTyping: data.isTyping,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
        });
        break;

      case 'user_list':
        eventHandlers.onUserList?.(data.users || []);
        break;

      case 'message_sent':
        // Optional: handle message send confirmation
        console.log('Message sent:', data.messageId);
        break;

      case 'error':
        console.error('Server error:', data.message);
        eventHandlers.onError?.(new Error(data.message));
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  },

  /**
   * End the chat stream
   */
  endChatStream() {
    // Cancel any pending reconnect
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    isIntentionalClose = true;

    if (ws) {
      try {
        ws.close(1000, 'User disconnected');
      } catch (e) {
        console.warn('Error closing WebSocket:', e);
      }
      ws = null;
    }
    eventHandlers = {};
  },

  /**
   * Send a message (global or private)
   * @param {string} text - Message text
   * @param {string|null} recipientId - Recipient user ID for private message, null for global
   * @returns {Promise<{success: boolean, messageId: string}>}
   */
  async sendMessage(text, recipientId = null) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const messageId = generateMessageId();
    const message = {
      type: 'message',
      id: messageId,
      text: text,
    };

    if (recipientId) {
      message.recipientId = recipientId;
    }

    ws.send(JSON.stringify(message));

    return {
      success: true,
      messageId: messageId,
    };
  },

  /**
   * Get list of all users
   * @returns {Promise<Array<{id: string, name: string, isOnline: boolean}>>}
   */
  async getUsers() {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    ws.send(JSON.stringify({ type: 'get_users' }));

    // Server akan mengirim user_list sebagai response
    return [];
  },

  /**
   * Send typing indicator
   * @param {string} contextId - "global" or recipient user ID for private chat
   * @param {boolean} isTyping - Whether user is typing
   */
  async sendTyping(contextId, isTyping) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const message = {
      type: 'typing',
      contextId: contextId,
      isTyping: isTyping,
    };

    ws.send(JSON.stringify(message));
  },

  /**
   * Check if chat service is available
   */
  async isAvailable() {
    return ws && ws.readyState === WebSocket.OPEN;
  },

  /**
   * Check if currently connected to chat stream
   */
  isConnected() {
    return ws && ws.readyState === WebSocket.OPEN;
  },
};

export default chatService;
