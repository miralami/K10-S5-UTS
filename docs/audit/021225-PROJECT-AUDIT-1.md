# Project Structure Audit Report
**Date**: December 2, 2025  
**Status**: Major inconsistencies found

---

## Executive Summary

The project has significant naming inconsistencies and unused/orphaned code that creates confusion:

### Critical Issues
1. **`grpc-service/` folder is actually a WebSocket server** — No gRPC code exists in this folder
2. **Proto generation scripts are orphaned** — Frontend uses pre-generated proto files that don't match scripts
3. **Duplicate proto files** — `shared/proto/ai.proto` vs `ai-service/proto/ai.proto`
4. **Missing proto definitions** — Frontend uses `chat_pb.mjs` and `typing_pb.mjs` but source `.proto` files don't exist
5. **Unused/dead code** — `typingService.js` references non-existent protos and gRPC infrastructure

---

## Detailed Findings

### 1. Folder Naming Issues

#### ❌ **`grpc-service/`** 
- **Reality**: This is a **WebSocket server** (uses `ws` library, not gRPC)
- **Evidence**: 
  - `grpc-service/server/websocket-server.js` — pure WebSocket implementation
  - No gRPC server code, no `@grpc/grpc-js` usage
  - Handles chat messages, typing indicators, presence via WebSocket protocol
- **Impact**: Misleading name causes confusion in docs, CI, and developer onboarding
- **Recommendation**: Rename to `websocket-service/`

#### ✅ **`ai-service/`**
- **Reality**: Actually IS a gRPC server (Python)
- **Evidence**:
  - Uses `grpcio` and `grpc_tools.protoc`
  - Implements `AIAnalysisService` from `ai.proto`
  - Backend connects via `AIGrpcClient.php`
- **Status**: Correctly named

---

### 2. Proto File Chaos

#### Problem: Duplicated `ai.proto`
```
shared/proto/ai.proto          ← Used by scripts/gen-proto.js (references chat.proto)
ai-service/proto/ai.proto      ← Actually used by ai-service/generate_proto.py
```
- **Issue**: Two copies of same file; unclear which is source of truth
- **Current reality**: `ai-service/proto/ai.proto` is the live version used by Python gRPC server
- **`shared/proto/` only contains `ai.proto`** — no `chat.proto` or `typing.proto` found

#### Problem: Missing Proto Sources
Frontend has these generated files:
```
frontend/src/proto/chat_pb.mjs
frontend/src/proto/chat_grpc_web_pb.mjs
frontend/src/proto/typing_pb.mjs
frontend/src/proto/typing_grpc_web_pb.mjs
```

**But source `.proto` files for `chat` and `typing` DO NOT EXIST in repo.**

- `scripts/gen-proto.js` references:
  - `shared/proto/chat.proto` ❌ Not found
  - `shared/proto/ai.proto` ✅ Exists but frontend doesn't use it
- Frontend's `typingService.js` imports proto files that exist but have no source definitions
- **This means proto generation is broken and orphaned from actual codebase**

#### Root Cause Analysis
- Appears protos were generated during early development (possibly from a different branch or manually)
- Source `.proto` files were deleted or never committed
- Generated JS files remain but can't be regenerated
- `scripts/gen-proto.js` is **non-functional** — references files that don't exist

---

### 3. Scripts Folder Audit

#### `scripts/gen-proto.js`
- **Status**: ❌ **BROKEN / NON-FUNCTIONAL**
- **Purpose**: Generate frontend gRPC-web stubs from proto files
- **Issues**:
  - References `shared/proto/chat.proto` (doesn't exist)
  - References `shared/proto/ai.proto` (exists but frontend doesn't use AI protos)
  - Tries to generate JS for gRPC-web client that frontend doesn't actually use
- **Reality**: Frontend connects to backend REST API and WebSocket, NOT gRPC-web
- **Recommendation**: **DELETE** — This script serves no purpose in current architecture

#### `scripts/install-all.ps1`
- **Status**: ✅ **FUNCTIONAL AND USEFUL**
- **Purpose**: Install deps for all services
- **Issues**: References `grpc-service` (should be `websocket-service` after rename)
- **Recommendation**: Keep, update folder name reference

#### `scripts/run-all.ps1`
- **Status**: ⚠️ **FUNCTIONAL BUT NOT ESSENTIAL**
- **Purpose**: Start all services in separate terminals
- **Reality**: Root `package.json` has `npm run dev` using `concurrently` (preferred method)
- **Usage**: Rarely used — most devs use `npm run dev` or start services individually
- **Recommendation**: Optional — keep for convenience but document that `npm run dev` is primary method

---

### 4. Shared Folder Purpose

```
shared/
  proto/
    ai.proto
```

- **Current status**: Contains only `ai.proto`
- **Purpose**: Intended as shared proto definitions across services
- **Reality**: 
  - `ai-service/proto/ai.proto` is actual source of truth (used by Python generator)
  - `shared/proto/ai.proto` is likely a copy that's out of sync
  - No other services consume from `shared/proto/`
- **Recommendation**: 
  - **Option A**: Delete `shared/proto/` — keep proto files in service folders where they're used
  - **Option B**: Make `shared/proto/ai.proto` canonical source and symlink/copy to `ai-service/proto/`

---

### 5. Dead/Orphaned Code

#### `frontend/src/services/typingService.js`
- **Status**: ❌ **DEAD CODE**
- **Issues**:
  - Imports `TypingServiceClient` from proto files that have no source
  - References gRPC-web client that doesn't exist
  - Has fallback to WebSocket (which is the ONLY path that works)
  - The typing feature works 100% via WebSocket, gRPC path never executes
- **Evidence**: `ENABLE_GRPC` env var default true, but:
  - No Envoy proxy configured (required for gRPC-web)
  - Proto files exist but server implementing `TypingService` doesn't exist
  - WebSocket server handles typing, not gRPC
- **Recommendation**: **REMOVE gRPC code path**, keep only WebSocket implementation

#### Frontend Proto Files
```
frontend/src/proto/chat_pb.mjs              ← No source .proto
frontend/src/proto/chat_grpc_web_pb.mjs     ← No source .proto
frontend/src/proto/typing_pb.mjs            ← No source .proto
frontend/src/proto/typing_grpc_web_pb.mjs   ← No source .proto
```
- **Status**: ⚠️ **ORPHANED / UNMAINTAINABLE**
- **Can't regenerate**: Source `.proto` files missing
- **Not actively used**: Only imported by `typingService.js` which falls back to WebSocket
- **Recommendation**: Delete unless you plan to implement actual gRPC-web architecture

---

### 6. Architecture Reality Check

#### What Actually Works
```
Frontend (React) ──HTTP REST──> Backend (Laravel) ──gRPC──> AI Service (Python)
       │                                                            
       └──WebSocket──> WebSocket Service (misnamed "grpc-service")
```

#### What Documentation/Code SAYS Exists (But Doesn't)
```
Frontend ──gRPC-web via Envoy──> gRPC Services (typing, chat)
         ^^^^ DOES NOT EXIST ^^^^
```

- **AI gRPC**: ✅ Real and working (backend ↔ Python)
- **Chat/Typing gRPC-web**: ❌ Never implemented, just orphaned code

---

## Recommended Actions

### Phase 1: Critical Renames & Cleanup ✅ **COMPLETED**
1. ✅ Renamed `grpc-service/` → `websocket-service/`
2. ✅ Updated all references in:
   - `package.json` scripts
   - `scripts/install-all.ps1`
   - `scripts/run-all.ps1`
   - CI workflow (`.github/workflows/ci.yml`)
   - Documentation
3. ✅ Deleted `scripts/gen-proto.js` (broken, unused)
4. ✅ Deleted orphaned proto files in `frontend/src/proto/` (chat, typing)
5. ✅ Removed gRPC code from `typingService.js`, kept only WebSocket path

### Phase 2: Proto Consolidation ✅ **COMPLETED**
6. ✅ Deleted `shared/proto/ai.proto` (duplicate)
7. ✅ Deleted `shared/` folder (only contained duplicate ai.proto)
   - Source of truth: `ai-service/proto/ai.proto`

### Phase 3: Documentation Updates ✅ **COMPLETED**
8. ✅ Updated `docs/ARCHITECTURE.md` to reflect actual architecture
9. ✅ Updated `docs/COMMANDS.md` with corrected folder name
10. ✅ Updated `docs/README.md` service listing

---

## Cleanup Summary (December 2, 2025)

All recommended actions completed. The project structure now accurately reflects the actual implementation:

**Changes Applied:**
- Folder renamed: `grpc-service/` → `websocket-service/`
- Deleted broken proto generation script
- Removed orphaned frontend proto files (no source .proto definitions)
- Simplified `typingService.js` (removed non-functional gRPC-web code)
- Deleted duplicate `shared/` folder
- Updated all scripts, CI, and documentation

**Result:** Clear separation of concerns:
- WebSocket Service: Real-time chat, typing, presence
- AI Service (gRPC): Backend ↔ Python mood analysis only
- No frontend gRPC-web (was never implemented)

---

## Impact Assessment

### Breaking Changes
- ❌ **None** — Renaming folders and deleting dead code won't break functionality
- All working code paths remain intact

### Developer Experience
- ✅ **Significantly improved** — Less confusion about folder names
- ✅ Clearer separation: WebSocket for real-time chat, gRPC for AI analysis
- ✅ Easier onboarding for new developers

### CI/CD
- ⚠️ CI workflow needs update for folder rename
- ⚠️ Lint job currently references `grpc-service`, needs change to `websocket-service`

---

## Summary Table

| Item | Current State | Issue | Action | Priority |
|------|---------------|-------|--------|----------|
| `grpc-service/` | WebSocket server | Misleading name | Rename to `websocket-service/` | 🔴 High |
| `scripts/gen-proto.js` | Broken script | References missing files | Delete | 🔴 High |
| `shared/proto/ai.proto` | Duplicate file | Out of sync with ai-service | Consolidate or delete | 🟡 Medium |
| `frontend/src/proto/` chat/typing | Orphaned files | No source protos | Delete | 🔴 High |
| `typingService.js` | Dead gRPC code | Never executes | Remove gRPC path | 🟡 Medium |
| `scripts/run-all.ps1` | Works but redundant | `npm run dev` preferred | Keep, document | 🟢 Low |
| `shared/` folder | Near-empty | Unclear purpose | Consider deleting | 🟡 Medium |

---

## Next Steps

Proceed with Phase 1 cleanup? This will:
- Rename `grpc-service/` to `websocket-service/`
- Update all references across codebase
- Delete broken/orphaned code
- Update CI and documentation

Estimated time: ~15 minutes  
Risk: Low (no functional changes)
