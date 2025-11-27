// ESM wrapper for chat gRPC-web service client
import grpcWeb from 'grpc-web';
import * as chatPb from './chat_pb.mjs';

// Validate grpc-web import
if (!grpcWeb || !grpcWeb.GrpcWebClientBase) {
  console.error('grpc-web not properly loaded:', grpcWeb);
}

const grpc = { web: grpcWeb };
const proto = { chat: chatPb };

/**
 * ChatServiceClient - gRPC-web client for the chat service
 */
export class ChatServiceClient {
  constructor(hostname, credentials, options) {
    if (!grpc.web || !grpc.web.GrpcWebClientBase) {
      throw new Error('grpc-web library not loaded properly');
    }
    if (!options) options = {};
    options.format = 'text';
    this.client_ = new grpc.web.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
  }

  /**
   * ChatStream - Start a persistent stream to receive all chat events
   * @param {!proto.chat.AuthRequest} request
   * @param {?Object<string, string>=} metadata
   * @return {!grpc.web.ClientReadableStream<!proto.chat.ServerMessage>}
   */
  chatStream(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/chat.ChatService/ChatStream',
      grpc.web.MethodType.SERVER_STREAMING,
      proto.chat.AuthRequest,
      proto.chat.ServerMessage,
      (req) => req.serializeBinary(),
      proto.chat.ServerMessage.deserializeBinary
    );

    return this.client_.serverStreaming(
      this.hostname_ + '/chat.ChatService/ChatStream',
      request,
      metadata || {},
      methodDescriptor
    );
  }

  /**
   * SendMessage - Send a message (global or private)
   * @param {!proto.chat.ClientMessage} request
   * @param {?Object<string, string>=} metadata
   * @return {!Promise<!proto.chat.SendMessageResponse>}
   */
  sendMessage(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/chat.ChatService/SendMessage',
      grpc.web.MethodType.UNARY,
      proto.chat.ClientMessage,
      proto.chat.SendMessageResponse,
      (req) => req.serializeBinary(),
      proto.chat.SendMessageResponse.deserializeBinary
    );

    return new Promise((resolve, reject) => {
      this.client_.rpcCall(
        this.hostname_ + '/chat.ChatService/SendMessage',
        request,
        metadata || {},
        methodDescriptor,
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * GetUsers - Get list of all users
   * @param {!proto.chat.Empty} request
   * @param {?Object<string, string>=} metadata
   * @return {!Promise<!proto.chat.UserList>}
   */
  getUsers(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/chat.ChatService/GetUsers',
      grpc.web.MethodType.UNARY,
      proto.chat.Empty,
      proto.chat.UserList,
      (req) => req.serializeBinary(),
      proto.chat.UserList.deserializeBinary
    );

    return new Promise((resolve, reject) => {
      this.client_.rpcCall(
        this.hostname_ + '/chat.ChatService/GetUsers',
        request,
        metadata || {},
        methodDescriptor,
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  /**
   * SendTyping - Send a typing indicator
   * @param {!proto.chat.TypingEvent} request
   * @param {?Object<string, string>=} metadata
   * @return {!Promise<!proto.chat.Empty>}
   */
  sendTyping(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/chat.ChatService/SendTyping',
      grpc.web.MethodType.UNARY,
      proto.chat.TypingEvent,
      proto.chat.Empty,
      (req) => req.serializeBinary(),
      proto.chat.Empty.deserializeBinary
    );

    return new Promise((resolve, reject) => {
      this.client_.rpcCall(
        this.hostname_ + '/chat.ChatService/SendTyping',
        request,
        metadata || {},
        methodDescriptor,
        (err, response) => {
          if (err) {
            reject(err);
          } else {
            resolve(response);
          }
        }
      );
    });
  }
}

// Re-export proto messages for convenience
export {
  chatPb as proto
};
