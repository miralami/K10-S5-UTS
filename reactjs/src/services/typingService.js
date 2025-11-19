import { TypingServiceClient } from '../proto/typing_grpc_web_pb';
import { ClientTypingEvent } from '../proto/typing_pb';

// Configuration
const GRPC_HOST = 'http://localhost:8081'; // Envoy proxy
const ENABLE_GRPC = true;

let client = null;
let stream = null;

if (ENABLE_GRPC) {
  client = new TypingServiceClient(GRPC_HOST, null, null);
}

export const typingService = {
  startStream: (channelId, userId, onData, onError) => {
    if (!ENABLE_GRPC || !client) {
      console.warn('gRPC disabled or client not initialized');
      return null;
    }

    const metadata = {
      'user_id': userId,
      // 'authorization': `Bearer ${token}` // Add token here
    };

    stream = client.typingStream(metadata);

    stream.on('data', (response) => {
      const event = {
        userId: response.getUserId(),
        userName: response.getUserName(),
        channelId: response.getChannelId(),
        isTyping: response.getIsTyping(),
        timestamp: response.getTimestamp(),
      };
      onData(event);
    });

    stream.on('error', (err) => {
      console.error('gRPC Stream Error:', err);
      if (onError) onError(err);
    });

    stream.on('end', () => {
      console.log('gRPC Stream Ended');
    });

    // Send initial join/handshake if needed, or just keep open
    return stream;
  },

  sendTyping: (channelId, isTyping) => {
    if (!stream) return;

    const request = new ClientTypingEvent();
    request.setChannelId(channelId);
    request.setIsTyping(isTyping);
    
    try {
      stream.write(request);
    } catch (e) {
      console.error('Error sending typing event:', e);
    }
  },

  endStream: () => {
    if (stream) {
      stream.end();
      stream = null;
    }
  }
};
