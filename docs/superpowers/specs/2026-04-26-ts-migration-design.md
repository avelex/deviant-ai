# TypeScript Migration: Referee and Agent-Base Design

**Date:** 2026-04-26
**Topic:** Migrating TEE-based referee and agent services from Python to TypeScript.

## 1. Goal
Migrate the existing Python-based `referee` and `agent-base` services to TypeScript to leverage the `@0gfoundation/0g-ts-sdk` and `@phala/dstack-sdk` for better integration with the 0G stack and TEE features.

## 2. Architecture

### 2.1 Agent-Base (TS)
A containerized Node.js service that acts as a runtime environment for chess agent scripts.

- **Storage Integration**: Uses `@0gfoundation/0g-ts-sdk` to download agent scripts from 0G Storage based on a provided `SCRIPT_HASH`.
- **Dynamic Execution**: 
  - Downloads `.ts` or `.js` scripts.
  - If `.ts`, uses `typescript` compiler API (`transpileModule`) to convert to `.js`.
  - Executes the code using Node.js `vm` module for isolation.
- **API**:
  - `GET /health`: Health check.
  - `POST /move`: Accepts a FEN string, calls the agent's `get_move` function, and returns a UCI move.

### 2.2 Referee (TS)
A containerized Node.js service that orchestrates the tournament.

- **Game Logic**: Uses `chess.js` to maintain game state, validate moves, and detect game-over conditions.
- **Orchestration**: 
  - Polls agents' health status until they are ready.
  - Runs the turn-based game loop.
  - Communicates with agents via HTTP POST requests.
- **Attestation & Signing**: 
  - Uses `@phala/dstack-sdk` (`DstackClient`) to derive hardware-bound keys and generate TDX quotes.
  - Signs the final game result and includes the attestation quote in the output.
- **Output**: Logs the `FINAL_RESULT` as a JSON string for the watcher to consume.

## 3. Tech Stack
- **Runtime**: Node.js 20+
- **Language**: TypeScript 5.x
- **Web Framework**: Express 4.x
- **SDKs**:
  - `@0gfoundation/0g-ts-sdk` (0G Storage)
  - `@phala/dstack-sdk` (TEE/dStack interaction)
- **Utilities**:
  - `chess.js` (Chess logic)
  - `axios` (HTTP client)
  - `typescript` (On-the-fly transpilation)
  - `ethers` (Provider/Signer support for 0G SDK)

## 4. Components & Interfaces

### 4.1 Agent Interface
Agent scripts must export a `get_move` function:
```typescript
export function get_move(fen: string): string;
```

### 4.2 Referee Result Schema
```json
{
  "winner": "Agent 1" | "Agent 2" | "Draw",
  "reason": "normal" | "timeout" | "illegal_move",
  "pgn": "...",
  "attestation": {
    "quote": "...",
    "hash": "...",
    "signature": "..."
  }
}
```

## 5. Deployment
Both services will be containerized using `Dockerfile`.
- **Agent-Base Dockerfile**: Multi-stage or single stage with `node_modules` and `typescript` installed.
- **Referee Dockerfile**: Contains the game loop logic and dstack SDK.

## 6. Implementation Strategy
1.  Initialize `package.json` and `tsconfig.json` for both services.
2.  Implement 0G Download logic in `agent-base`.
3.  Implement `vm` execution logic in `agent-base`.
4.  Implement `referee` game loop and agent communication.
5.  Integrate `dstack-sdk` for attestation in `referee`.
6.  Update `agent-base/Dockerfile` and `referee/Dockerfile`.
7.  Update `docker-compose.template.yml` if necessary.
