import { TypingServiceClient } from '../proto/typing_grpc_web_pb.mjs';
import { ClientTypingEvent } from '../proto/typing_pb.mjs';

// Configuration
const GRPC_HOST = 'http://localhost:8081'; // Envoy proxy
const ENABLE_GRPC = import.meta.env.VITE_ENABLE_GRPC !== 'false'; // default true, set VITE_ENABLE_GRPC=false to disable

let client = null;
let stream = null;
let grpcAvailable = false;

if (ENABLE_GRPC && TypingServiceClient) {
  try {
    client = new TypingServiceClient(GRPC_HOST, null, null);
    grpcAvailable = true;
    console.log('gRPC client initialized for typing service');
  } catch (e) {
    console.warn('Failed to initialize gRPC client:', e);
    grpcAvailable = false;
  }
} else if (ENABLE_GRPC) {
  console.warn('TypingServiceClient not found — check proto import/exports');
}

export const typingService = {
  startStream: (channelId, userId, onData, onError) => {
    if (!ENABLE_GRPC || !client || !grpcAvailable) {
      console.warn('gRPC disabled or not available. Falling back to WebSocket for typing indicator.');
      // Fallback: listen to window 'typingEvent' dispatched by WebSocket handler
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

      // return an object so caller can optionally store/cleanup, but we also expose endStream
      stream = { __fallbackHandler: handler };
      return stream;
    }

    // Create initial request with channel info
    const request = new ClientTypingEvent();
    request.setChannelId(channelId);
    request.setIsTyping(false); // Initial state

    const metadata = {
      'user_id': userId,
      'channel_id': channelId,
      // 'authorization': `Bearer ${token}` // Add token here
    };

    // Start server streaming (grpc-web doesn't support bidi streaming)
    stream = client.typingStream(request, metadata);

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
      // If Envoy/gRPC not available, disable and notify
      if (err.code === 2 || err.message?.includes('CORS') || err.message?.includes('400 or 500')) {
        console.warn('gRPC/Envoy not available. Typing indicator via gRPC disabled. Use WebSocket instead.');
        grpcAvailable = false;
        client = null;
      }
      if (onError) onError(err);
    });

    stream.on('end', () => {
      console.log('gRPC Stream Ended');
    });

    stream.on('status', (status) => {
      console.log('gRPC Stream Status:', status);
    });

    console.log('Started gRPC server stream for channel:', channelId);
    return stream;
  },

  sendTyping: (channelId, isTyping) => {
    // Note: grpc-web doesn't support bidirectional streaming
    // For now, we just log. You could implement a separate unary RPC
    // or use WebSocket for sending typing updates
    console.log('sendTyping called (not supported in grpc-web server streaming):', channelId, isTyping);
    // TODO: Implement via WebSocket or separate unary gRPC call
  },

  endStream: () => {
    if (stream) {
      // grpc-web server streaming uses cancel(), not end()
      if (stream.__fallbackHandler) {
        window.removeEventListener('typingEvent', stream.__fallbackHandler);
      }
      if (typeof stream.cancel === 'function') {
        stream.cancel();
      }
      stream = null;
    }
  }
};
