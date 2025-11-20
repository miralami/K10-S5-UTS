// ESM wrapper for typing_grpc_web_pb.js (CommonJS generated file)
import grpcWeb from 'grpc-web';
import * as typingPb from './typing_pb.mjs';

const grpc = { web: grpcWeb };
const proto = { typing: typingPb };

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 */
export class TypingServiceClient {
  constructor(hostname, credentials, options) {
    if (!options) options = {};
    options.format = 'text';
    this.client_ = new grpc.web.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
  }

  typingStream(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/typing.TypingService/TypingStream',
      grpc.web.MethodType.SERVER_STREAMING,
      proto.typing.ClientTypingEvent,
      proto.typing.ServerTypingEvent,
      (req) => req.serializeBinary(),
      proto.typing.ServerTypingEvent.deserializeBinary
    );

    return this.client_.serverStreaming(
      this.hostname_ + '/typing.TypingService/TypingStream',
      request,
      metadata || {},
      methodDescriptor
    );
  }
}

/**
 * @param {string} hostname
 * @param {?Object} credentials
 * @param {?grpc.web.ClientOptions} options
 * @constructor
 */
export class TypingServicePromiseClient {
  constructor(hostname, credentials, options) {
    if (!options) options = {};
    options.format = 'text';
    this.client_ = new grpc.web.GrpcWebClientBase(options);
    this.hostname_ = hostname.replace(/\/+$/, '');
  }

  typingStream(request, metadata) {
    const methodDescriptor = new grpc.web.MethodDescriptor(
      '/typing.TypingService/TypingStream',
      grpc.web.MethodType.SERVER_STREAMING,
      proto.typing.ClientTypingEvent,
      proto.typing.ServerTypingEvent,
      (req) => req.serializeBinary(),
      proto.typing.ServerTypingEvent.deserializeBinary
    );

    return this.client_.serverStreaming(
      this.hostname_ + '/typing.TypingService/TypingStream',
      request,
      metadata || {},
      methodDescriptor
    );
  }
}
