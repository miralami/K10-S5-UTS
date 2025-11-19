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
# Create output directory if not exists (Unix)
mkdir -p reactjs/src/proto

# Realtime Typing Indicator with gRPC

This feature adds a realtime typing indicator to the chat using gRPC (Node.js server) and grpc-web (React client).

## Architecture

- **Proto Definition**: `proto/typing.proto` defines the `TypingService`.
- **gRPC Server**: `expressJS/grpc-server.js` (Node.js) implements the service.
- **Envoy Proxy**: `deploy/envoy/grpc-web-envoy.yaml` proxies HTTP/1.1 (grpc-web) from browser to HTTP/2 (gRPC).
- **React Client**: `reactjs/src/services/typingService.js` connects to Envoy via grpc-web.

## Prerequisites

- `Node.js` (for server and client)
- `Docker` (for Envoy proxy)
- `protoc` (Protocol Buffers Compiler) or the node-based `grpc-tools` plus the `protoc-gen-grpc-web` plugin

## Setup Steps

**1) Install dependencies**

```powershell
# From repo root
npm install
# Also install server/client deps if needed
npm --prefix expressJS install
npm --prefix reactjs install
```

**2) Generate Proto Files (Required for React client)**

This project includes a helper script `npm run gen:proto` that attempts to:
- prefer a locally installed `protoc-gen-grpc-web` from `node_modules/.bin`;
- prefer a local Node-based `grpc_tools_node_protoc` (from `grpc-tools`) when available;
- otherwise use `protoc` available on your PATH or via the `PROTOC` env var.

Recommended (cross-platform, from project root):

```powershell
# ensure node deps are installed
npm install

# generate JS + grpc-web client files
npm run gen:proto
```

What the helper does:
- Creates `reactjs/src/proto` if missing.
- Generates `typing_pb.js` and `typing_grpc_web_pb.js` into `reactjs/src/proto`.

Direct commands (if you prefer manual control):

- Unix / bash (Linux/macOS):

```bash
# create output dir
mkdir -p reactjs/src/proto

protoc -I=proto proto/typing.proto \
  --js_out=import_style=commonjs:reactjs/src/proto \
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:reactjs/src/proto
```

- Windows / PowerShell (using a system `protoc` and an npm-installed plugin):

```powershell
# create output dir
New-Item -ItemType Directory -Force -Path reactjs\src\proto

# resolve plugin (example)
$plugin = (Resolve-Path .\node_modules\.bin\protoc-gen-grpc-web.cmd).Path

# run protoc (adjust path to protoc.exe if not on PATH)
& 'C:\tools\protoc\bin\protoc.exe' --plugin=protoc-gen-grpc-web="$plugin" -I=proto proto/typing.proto `
  --js_out=import_style=commonjs:reactjs/src/proto `
  --grpc-web_out=import_style=commonjs,mode=grpcwebtext:reactjs/src/proto
```

Notes:
- If `protoc` is on your PATH, omit the full path to `protoc.exe`.
- If you installed `protoc-gen-grpc-web` via `npm i -D protoc-gen-grpc-web`, the `gen:proto` helper will find the `node_modules/.bin` wrapper automatically.
- If you prefer `protoc` from `C:\tools\protoc\bin`, you can set the environment variable `PROTOC` before running the helper:

```powershell
$env:PROTOC = 'C:\tools\protoc\bin\protoc.exe'
npm run gen:proto
```

If you cannot run `protoc` locally, you can copy the generated files `typing_pb.js` and `typing_grpc_web_pb.js` into `reactjs/src/proto/` from another machine or pre-built artifacts.

**3) Run the gRPC server (Node/Express)**

```powershell
cd expressJS
npm run grpc:start
# Server listens on port 50051 by default
```

**4) Run Envoy proxy (Docker)**

This proxies port `8081` (browser/grpc-web) to `50051` (gRPC server).

Unix example:

```bash
docker run -d -v "$(pwd)/deploy/envoy/grpc-web-envoy.yaml:/etc/envoy/envoy.yaml:ro" \
  -p 8081:8081 \
  envoyproxy/envoy:v1.22.0
```

Windows notes:
- On Windows `--network host` often doesn't work. The provided `grpc-web-envoy.yaml` uses `host.docker.internal` when appropriate — map ports and use the example above.
- If you run into connectivity issues, edit `deploy/envoy/grpc-web-envoy.yaml` to point to the correct host for your gRPC server.

**5) Run the React app**

```powershell
cd reactjs
npm run dev
```

## Usage

1. Open the Chat page in a browser.
2. Enter a username.
3. Start typing in the input box.
4. Open another browser window/tab and login with a different name.
5. You should see an "X is typing..." indicator in the other window.

## Troubleshooting

- "protoc is not recognized": make sure `protoc` is installed and on your PATH, or set `PROTOC` to the full path of `protoc.exe` before running `npm run gen:proto`.
- "protoc-gen-grpc-web is not recognized": install `protoc-gen-grpc-web` either globally or locally (`npm i -D protoc-gen-grpc-web`) and use the `--plugin` option or the `gen:proto` helper which prefers the local plugin.
- If `--js_out` fails with `protoc-gen-js` not found, use the Node-based `grpc-tools` wrapper (`grpc_tools_node_protoc`) — the project includes this as a devDependency and the helper tries to use it when available.

## Files produced

- `reactjs/src/proto/typing_pb.js`
- `reactjs/src/proto/typing_grpc_web_pb.js`

These are the files the React client imports to call the typing gRPC service.

## Regenerating after proto changes

After you change `proto/typing.proto`, run:

```powershell
npm run gen:proto
```

This will overwrite the existing generated files in `reactjs/src/proto`.

---

If you want, I can also add a small `scripts/install-protoc.ps1` to download and install `protoc` and the `protoc-gen-grpc-web` plugin into `C:\tools\protoc` and update your User PATH. Say the word and I'll add that helper.
