# gRPC Implementation Workflow

## High Level Overview
1. **Define Interface:** Write the `.proto` file.
2. **Generate Code:** Run the protocol buffer compiler.
3. **Implement Server:** Write the business logic for the service.
4. **Implement Client:** Write the code to consume the service.
5. **Run & Connect:** Start the server and connect the client.

---

## Low Level Explanation

### 1. Define Interface (.proto)
Create a file (e.g., `service.proto`) using Protocol Buffers syntax (proto3).
*   **Define Messages:** Specify the data structures (requests and responses) with typed fields.
*   **Define Service:** Declare the service name and the RPC methods (endpoints) it exposes, linking the request and response messages.

### 2. Generate Code
Use the `protoc` compiler (or language-specific plugins) to generate the boilerplate code (stubs) for your target programming language.
*   **Command:** `protoc --go_out=. --go-grpc_out=. service.proto` (example for Go).
*   **Output:** This creates files containing the data classes for your messages and the abstract interfaces for your client and server.

### 3. Implement Server
Create the server application that uses the generated code.
*   **Struct/Class:** Create a class that inherits from the generated "Unimplemented" server base class.
*   **Logic:** Override the service methods defined in your `.proto` file with actual business logic.
*   **Bootstrap:**
    *   Create a TCP listener (e.g., on port 50051).
    *   Instantiate a new gRPC server object.
    *   Register your service implementation with the gRPC server.
    *   Start `Serve()`.

### 4. Implement Client
Create the client application to call the server.
*   **Channel:** Create a gRPC channel (connection) to the server's address (e.g., `localhost:50051`).
*   **Stub:** Instantiate the generated Client Stub using the channel.
*   **Call:** Call the methods on the stub object just like local function calls, passing the request object and// filepath: .github/grpc_workflow.md
# gRPC Implementation Workflow

## High Level Overview
1. **Define Interface:** Write the `.proto` file.
2. **Generate Code:** Run the protocol buffer compiler.
3. **Implement Server:** Write the business logic for the service.
4. **Implement Client:** Write the code to consume the service.
5. **Run & Connect:** Start the server and connect the client.

---

## Low Level Explanation

### 1. Define Interface (.proto)
Create a file (e.g., `service.proto`) using Protocol Buffers syntax (proto3).
*   **Define Messages:** Specify the data structures (requests and responses) with typed fields.
*   **Define Service:** Declare the service name and the RPC methods (endpoints) it exposes, linking the request and response messages.

### 2. Generate Code
Use the `protoc` compiler (or language-specific plugins) to generate the boilerplate code (stubs) for your target programming language.
*   **Command:** `protoc --go_out=. --go-grpc_out=. service.proto` (example for Go).
*   **Output:** This creates files containing the data classes for your messages and the abstract interfaces for your client and server.

### 3. Implement Server
Create the server application that uses the generated code.
*   **Struct/Class:** Create a class that inherits from the generated "Unimplemented" server base class.
*   **Logic:** Override the service methods defined in your `.proto` file with actual business logic.
*   **Bootstrap:**
    *   Create a TCP listener (e.g., on port 50051).
    *   Instantiate a new gRPC server object.
    *   Register your service implementation with the gRPC server.
    *   Start `Serve()`.

### 4. Implement Client
Create the client application to call the server.
*   **Channel:** Create a gRPC channel (connection) to the server's address (e.g., `localhost:50051`).
*   **Stub:** Instantiate the generated Client Stub using the channel.
*   **Call:** Call the methods on the stub object just like local function calls, passing the request object and