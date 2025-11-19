# Realtime Typing Indicator with gRPC

This feature adds a realtime typing indicator to the chat using gRPC (Node.js server) and grpc-web (React client).

## Architecture

1.  **Proto Definition**: `proto/typing.proto` defines the `TypingService`.
2.  **gRPC Server**: `expressJS/grpc-server.js` (Node.js) implements the service.
3.  **Envoy Proxy**: `deploy/envoy/grpc-web-envoy.yaml` proxies HTTP/1.1 (grpc-web) from browser to HTTP/2 (gRPC).
4.  **React Client**: `reactjs/src/services/typingService.js` connects to Envoy via grpc-web.

## Prerequisites

1.  **Node.js** (for server and client)
2.  **Docker** (for Envoy proxy)
3.  **protoc** (Protocol Buffers Compiler) with `protoc-gen-grpc-web` plugin (for generating client code)

## Setup Steps

### 1. Install Dependencies

```bash
# Express/Node Server
cd expressJS
npm install

# React Client
cd ../reactjs
npm install
```

### 2. Generate Proto Files (Required for React)

You need to generate the JS client code from the proto file.
Run this command from the project root (requires `protoc` and `protoc-gen-grpc-web`):

```bash
# Create output directory if not exists
mkdir -p reactjs/src/proto

# Generate code
protoc -I=proto proto/typing.proto \
  --js_out=import_style=commonjs:reactjs/src/proto \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:reactjs/src/proto
```

*Note: If you cannot run protoc, you will need to obtain the generated files `typing_pb.js` and `typing_grpc_web_pb.js` and place them in `reactjs/src/proto/`.*

### 3. Run the gRPC Server

```bash
cd expressJS
npm run grpc:start
# Server runs on port 50051
```

### 4. Run Envoy Proxy (Docker)

This proxies port 8081 (browser) to 50051 (gRPC server).

```bash
docker run -d -v "$(pwd)/deploy/envoy/grpc-web-envoy.yaml:/etc/envoy/envoy.yaml:ro" \
    -p 8081:8081 \
    --network host \
    envoyproxy/envoy:v1.22.0
```

*Note: On Windows/Mac, `--network host` might not work as expected. You might need to adjust the `socket_address` in `grpc-web-envoy.yaml` to `host.docker.internal` (already configured) and map ports.*

### 5. Run React App

```bash
cd reactjs
npm run dev
```

## Usage

1.  Open the Chat page.
2.  Enter a username.
3.  Start typing in the input box.
4.  Open another browser window/tab, login with a different name.
5.  You should see "X is typing..." in the other window.
