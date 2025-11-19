import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROTO_PATH = path.join(__dirname, '../proto/typing.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const typingProto = grpc.loadPackageDefinition(packageDefinition).typing;

// Store active streams: channel_id -> Set of call objects
const channels = new Map();

function typingStream(call) {
  let userId = null;
  let userName = null;
  let currentChannel = null;

  // Extract metadata (e.g., auth token)
  // const metadata = call.metadata.getMap();
  // TODO: Validate JWT from metadata['authorization']

  call.on('data', (clientEvent) => {
    // On first message or metadata, we might identify the user
    // For now, we'll assume the client sends some ID or we parse it from token
    // In a real app, userId comes from JWT.
    // For this demo, let's assume the client sends it or we generate a temp one if missing,
    // but the proto doesn't have user_id in ClientTypingEvent.
    // We'll rely on metadata or just mock it for now if not provided.
    
    // Mock user extraction if not set
    if (!userId) {
        // In production: userId = verifyToken(metadata['authorization']).sub
        // For demo: use a random ID or one passed in metadata if we added it there
        userId = call.metadata.get('user_id')[0] || 'anon_' + Math.floor(Math.random() * 1000);
        userName = call.metadata.get('user_name')[0] || userId;
    }

    const { channel_id, is_typing } = clientEvent;

    // Handle channel subscription
    if (currentChannel !== channel_id) {
      // Leave old channel
      if (currentChannel && channels.has(currentChannel)) {
        channels.get(currentChannel).delete(call);
      }
      // Join new channel
      currentChannel = channel_id;
      if (!channels.has(currentChannel)) {
        channels.set(currentChannel, new Set());
      }
      channels.get(currentChannel).add(call);
    }

    // Broadcast to others in the channel
    const serverEvent = {
      user_id: userId,
      user_name: userName,
      channel_id: channel_id,
      is_typing: is_typing,
      timestamp: Date.now(),
    };

    const subscribers = channels.get(channel_id);
    if (subscribers) {
      for (const subscriber of subscribers) {
        // Don't echo back to sender (optional, but usually good for typing indicators)
        if (subscriber !== call) {
          subscriber.write(serverEvent);
        }
      }
    }
  });

  call.on('end', () => {
    if (currentChannel && channels.has(currentChannel)) {
      channels.get(currentChannel).delete(call);
      // Broadcast stopped typing on disconnect
      if (userId) {
         const serverEvent = {
            user_id: userId,
            user_name: userName,
            channel_id: currentChannel,
            is_typing: false,
            timestamp: Date.now(),
          };
          const subscribers = channels.get(currentChannel);
          if (subscribers) {
            for (const subscriber of subscribers) {
                subscriber.write(serverEvent);
            }
          }
      }
    }
  });

  call.on('error', (err) => {
    console.error('Stream error:', err);
    if (currentChannel && channels.has(currentChannel)) {
      channels.get(currentChannel).delete(call);
    }
  });
}

function main() {
  const server = new grpc.Server();
  server.addService(typingProto.TypingService.service, { TypingStream: typingStream });
  
  const PORT = process.env.GRPC_PORT || '50051';
  server.bindAsync(`0.0.0.0:${PORT}`, grpc.ServerCredentials.createInsecure(), () => {
    console.log(`gRPC server running on port ${PORT}`);
    server.start();
  });
}

main();
