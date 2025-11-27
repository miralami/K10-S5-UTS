# Chat Feature Overhaul Plan

This document outlines the plan to overhaul the chat feature from an anonymous, single-room system into a user-centric messaging application similar to WhatsApp or Discord. The new system will feature a global chat for user discovery and private, end-to-end conversations between authenticated users.

### 1. Core Architectural Shift: WebSocket to gRPC

The current implementation uses a mix of WebSockets for chat messages and gRPC for typing indicators. To build a more robust, scalable, and strongly-typed system, the entire chat functionality will be migrated to a unified gRPC service.

-   **Why gRPC?**
    -   **Contract-First Design**: Using a `.proto` file as a single source of truth ensures the client and server data models are always synchronized, reducing integration errors.
    -   **Strong Typing**: Protobuf provides strong typing for all messages, leading to more reliable code on both the client and server.
    -   **Integration**: It integrates seamlessly with the existing JWT-based authentication system.
    -   **Scalability**: gRPC is built on HTTP/2 and is designed for high-performance, low-latency communication, making it suitable for a growing user base.

### 2. Backend & Proto Redesign

The gRPC service will be expanded to become the sole real-time communication layer for the chat.

#### `shared/proto/chat.proto`

The existing `typing.proto` will be renamed to `chat.proto` and its structure will be significantly expanded.

-   **Services**:
    -   `rpc ChatStream (AuthRequest) returns (stream ServerMessage)`: A persistent, server-streaming RPC that a user connects to upon authentication. This single stream will deliver global messages, private messages, and user presence updates.
    -   `rpc SendMessage (ClientMessage) returns (Empty)`: A unary RPC for a client to send a message. The server will be responsible for routing this message to the correct destination (either the global channel or a specific user).
    -   `rpc GetUsers (Empty) returns (UserList)`: A unary RPC to fetch a list of all registered users, enabling the user discovery feature on the frontend.

-   **Messages**:
    -   `User`: Defines a user with a unique `id` and `name`.
    -   `ServerMessage`: A versatile message wrapper using `oneof` to deliver different types of events to the client, such as a `GlobalMessage`, `PrivateMessage`, or a `UserPresenceUpdate`.
    -   `ClientMessage`: Represents a message sent from a client, containing the message text and an optional `recipient_id` to target a specific user for a private message.
    -   `UserList`: A message containing a repeated field of `User` objects.

#### `websocket-service/grpc-server.js`

The Node.js gRPC server will be updated to implement the new services and logic.

-   **Service Implementation**: Implement the new `ChatStream`, `SendMessage`, and `GetUsers` RPCs.
-   **Connection Management**: The server will maintain a map of authenticated `userId`s to their active gRPC `ChatStream` connections. This allows the server to push messages to specific online users.
-   **Message Routing**: When the server receives a `ClientMessage` via the `SendMessage` RPC, it will inspect the `recipient_id`.
    -   If `recipient_id` is present, the server will look up the recipient's active stream and forward the message as a `PrivateMessage`.
    -   If `recipient_id` is absent, the server will broadcast the message to all connected clients as a `GlobalMessage`.

### 3. Frontend UI/UX Overhaul

The `frontend/src/pages/Chat.jsx` component will be completely redesigned to support the new, sophisticated chat model.

-   **Authentication**: The anonymous "Enter your name" login flow will be removed. The chat component will now rely on the main application's authentication context to retrieve the user's identity and JWT.
-   **New Layout**: The UI will be restructured into a modern, three-panel layout:
    1.  **Sidebar (User/Conversation List)**: A new component will be created to display a list of all discoverable users (fetched via `GetUsers`) and active private conversations. This allows a user to initiate new chats or switch between existing ones.
    2.  **Chat Panel**: The main view will display the message history for the currently selected context (either the "Global Chat" or a private conversation).
    3.  **Message Input**: A redesigned input area for composing and sending messages to the active chat context.
-   **State Management**: The frontend's state management logic will be enhanced to:
    -   Track the currently active chat context (e.g., `{ type: 'global' }` or `{ type: 'private', user: { id: 'user-123', name: 'John Doe' } }`).
    -   Maintain separate message histories for each conversation in a structured way (e.g., a dictionary mapping conversation IDs to message arrays).
    -   Handle real-time updates from the `ChatStream` to append new messages to the correct conversation history.
