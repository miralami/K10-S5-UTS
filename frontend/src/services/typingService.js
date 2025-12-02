/**
 * Typing Indicator Service - WebSocket Implementation
 *
 * Listens for typing events dispatched by the WebSocket service.
 * Simplified from previous gRPC-web implementation that was never functional.
 */

let stream = null;

export const typingService = {
  /**
   * Start listening for typing events on a specific channel
   * @param {string} channelId - Channel or user ID to monitor
   * @param {string} userId - Current user ID (unused but kept for API compatibility)
   * @param {Function} onData - Callback when typing event received
   */
  startStream: (channelId, userId, onData) => {
    // Listen to 'typingEvent' dispatched by WebSocket handler
    const handler = (e) => {
      const d = e.detail;
      if (!d) return;
      if (d.channelId !== channelId) return;
      onData({
        userId: d.userId,
        userName: d.userName,
        channelId: d.channelId,
        isTyping: d.isTyping,
        timestamp: d.timestamp,
      });
    };

    window.addEventListener('typingEvent', handler);

    // Store handler for cleanup
    stream = { __fallbackHandler: handler };
    return stream;
  },

  /**
   * Send typing indicator (handled by chatService via WebSocket)
   * @param {string} channelId - Channel or user ID
   * @param {boolean} isTyping - Typing state
   */
  sendTyping: (channelId, isTyping) => {
    // Note: Actual sending is handled by chatService.sendTyping()
    // This is a no-op placeholder for API compatibility
    console.debug('typingService.sendTyping called:', channelId, isTyping);
  },

  /**
   * Stop listening for typing events and cleanup
   */
  endStream: () => {
    if (stream?.__fallbackHandler) {
      window.removeEventListener('typingEvent', stream.__fallbackHandler);
      stream = null;
    }
  },
};
