# TypeScript Migration: Referee and Agent-Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate referee and agent-base from Python to TypeScript using 0G TS SDK and dstack JS SDK.

**Architecture:** Both services are migrated to Node.js/Express. Agent-base handles dynamic TS execution via the `vm` module. Referee manages the chess match using `chess.js` and signs results using `@phala/dstack-sdk`.

**Tech Stack:** Node.js, TypeScript, Express, `@0gfoundation/0g-ts-sdk`, `@phala/dstack-sdk`, `chess.js`, `axios`.

---

### Task 1: Project Initialization

**Files:**
- Create: `tee-orchestrator/agent-base/package.json`
- Create: `tee-orchestrator/agent-base/tsconfig.json`
- Create: `tee-orchestrator/referee/package.json`
- Create: `tee-orchestrator/referee/tsconfig.json`

- [x] **Step 1: Create package.json for agent-base**
```json
{
  "name": "deviant-agent-base",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "ts-node index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@0gfoundation/0g-ts-sdk": "^1.2.6",
    "express": "^4.18.2",
    "ethers": "^6.13.4",
    "typescript": "^5.2.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.8.10",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

- [x] **Step 2: Create tsconfig.json for agent-base**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  }
}
```

- [x] **Step 3: Create package.json for referee**
```json
{
  "name": "deviant-referee",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "ts-node main.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@phala/dstack-sdk": "^0.0.1",
    "axios": "^1.6.2",
    "chess.js": "^1.0.0-beta.7",
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.8.10",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

- [x] **Step 4: Create tsconfig.json for referee**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist"
  }
}
```

- [x] **Step 5: Commit**
```bash
git add tee-orchestrator/agent-base/package.json tee-orchestrator/agent-base/tsconfig.json tee-orchestrator/referee/package.json tee-orchestrator/referee/tsconfig.json
git commit -m "chore: initialize TS projects for agent-base and referee"
```

### Task 2: Agent-Base - 0G Download Logic

**Files:**
- Create: `tee-orchestrator/agent-base/storage.ts`

- [x] **Step 1: Implement download script logic**
```typescript
import { Indexer } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';

const INDEXER_URL = process.env.INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";

export async function downloadScript(hash: string, destPath: string) {
    console.log(`[0G Storage] Downloading ${hash} to ${destPath}...`);
    const indexer = new Indexer(INDEXER_URL);
    
    try {
        const fileInfo = await indexer.getFileInfo(hash);
        if (!fileInfo) {
            throw new Error(`File info not found for hash: ${hash}`);
        }

        console.log(`[0G Storage] File size: ${fileInfo.size} bytes`);
        const chunks = Math.ceil(fileInfo.size / (256 * 1024));
        let fileData = Buffer.alloc(0);

        for (let i = 0; i < chunks; i++) {
            const chunk = await indexer.download(hash, i);
            fileData = Buffer.concat([fileData, Buffer.from(chunk)]);
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, fileData);
        console.log(`[0G Storage] Successfully downloaded and saved to ${destPath}`);
    } catch (e: any) {
        console.error(`[0G Storage] Failed to download ${hash}: ${e.message}`);
        throw e;
    }
}
```

- [x] **Step 2: Commit**
```bash
git add tee-orchestrator/agent-base/storage.ts
git commit -m "feat(agent-base): implement 0G Storage download logic"
```

### Task 3: Agent-Base - VM Execution Logic

**Files:**
- Create: `tee-orchestrator/agent-base/executor.ts`

- [x] **Step 1: Implement TS transpilation and VM execution**
```typescript
import * as ts from 'typescript';
import * as vm from 'vm';
import * as fs from 'fs';

export class AgentExecutor {
    private context: vm.Context;
    private scriptInstance: any;

    constructor() {
        this.context = vm.createContext({
            console,
            Buffer,
            setTimeout,
            setInterval,
            process: { env: {} },
            exports: {}
        });
    }

    public async loadScript(filePath: string) {
        let code = fs.readFileSync(filePath, 'utf8');

        if (filePath.endsWith('.ts')) {
            console.log(`[Executor] Transpiling ${filePath}...`);
            const result = ts.transpileModule(code, {
                compilerOptions: { module: ts.ModuleKind.CommonJS }
            });
            code = result.outputText;
        }

        const script = new vm.Script(code);
        script.runInContext(this.context);

        this.scriptInstance = this.context.exports;
        
        if (typeof this.scriptInstance.get_move !== 'function') {
            throw new Error('get_move function not found in agent script');
        }
    }

    public getMove(fen: string): string {
        return this.scriptInstance.get_move(fen);
    }
}
```

- [x] **Step 2: Commit**
```bash
git add tee-orchestrator/agent-base/executor.ts
git commit -m "feat(agent-base): implement VM execution with TS transpilation"
```

### Task 4: Agent-Base - Web Server

**Files:**
- Create: `tee-orchestrator/agent-base/index.ts`

- [x] **Step 1: Implement Express server and integration**
```typescript
import express from 'express';
import { downloadScript } from './storage';
import { AgentExecutor } from './executor';
import * as fs from 'fs';

const app = express();
app.use(express.json());

const SCRIPT_HASH = process.env.SCRIPT_HASH;
const AGENT_SCRIPT_PATH = process.env.AGENT_SCRIPT_PATH || "/data/agent.ts";
const PORT = process.env.PORT || 8080;

const executor = new AgentExecutor();

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.post('/move', (req, res) => {
    const { fen } = req.body;
    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const move = executor.getMove(fen);
        res.json({ move });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

async function start() {
    if (SCRIPT_HASH) {
        await downloadScript(SCRIPT_HASH, AGENT_SCRIPT_PATH);
    } else {
        console.warn("[Agent Base] SCRIPT_HASH not provided, skipping download.");
    }

    if (fs.existsSync(AGENT_SCRIPT_PATH)) {
        await executor.loadScript(AGENT_SCRIPT_PATH);
    }

    app.listen(PORT, () => {
        console.log(`[Agent Base] Listening on port ${PORT}`);
    });
}

start().catch(err => {
    console.error("[Agent Base] Fatal error during startup:", err);
    process.exit(1);
});
```

- [x] **Step 2: Commit**
```bash
git add tee-orchestrator/agent-base/index.ts
git commit -m "feat(agent-base): complete TS agent-base implementation"
```

### Task 5: Referee - Game Loop & Orchestration

**Files:**
- Create: `tee-orchestrator/referee/main.ts`

- [x] **Step 1: Implement game loop and agent communication**
```typescript
import axios from 'axios';
import { Chess } from 'chess.js';

const AGENT1_URL = process.env.AGENT1_URL || "http://agent1:8080/move";
const AGENT2_URL = process.env.AGENT2_URL || "http://agent2:8080/move";
const MOVE_TIMEOUT = 60000;

async function requestMove(url: string, fen: string): Promise<string | null> {
    try {
        const resp = await axios.post(url, { fen }, { timeout: MOVE_TIMEOUT });
        return resp.data.move;
    } catch (e: any) {
        console.error(`Error requesting move from ${url}: ${e.message}`);
        return null;
    }
}

async function playGame() {
    const board = new Chess();
    console.log("Starting chess match");

    // Wait for agents to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    while (!board.isGameOver()) {
        const currentTurn = board.turn();
        const url = currentTurn === 'w' ? AGENT1_URL : AGENT2_URL;
        const playerName = currentTurn === 'w' ? "Agent 1 (White)" : "Agent 2 (Black)";

        console.log(`Turn: ${playerName}`);
        const moveStr = await requestMove(url, board.fen());

        if (!moveStr) {
            console.log(`${playerName} failed to return a move. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "timeout_or_error", pgn: board.fen() };
        }

        try {
            const move = board.move(moveStr);
            if (!move) {
                console.log(`${playerName} made illegal move ${moveStr}. Game over.`);
                const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
                return { winner, reason: "illegal_move", pgn: board.fen() };
            }
            console.log(`Move played: ${moveStr}`);
        } catch (e: any) {
            console.log(`${playerName} returned invalid move format ${moveStr}: ${e.message}. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "invalid_format", pgn: board.fen() };
        }
    }

    const winner = board.isDraw() ? "Draw" : (board.turn() === 'w' ? "Agent 2" : "Agent 1");
    console.log(`Game finished. Winner: ${winner}`);
    return { winner, reason: "normal", pgn: board.fen() };
}
```

- [x] **Step 2: Commit**
```bash
git add tee-orchestrator/referee/main.ts
git commit -m "feat(referee): implement chess game loop in TS"
```

### Task 6: Referee - Attestation & Result Signing

**Files:**
- Modify: `tee-orchestrator/referee/main.ts`

- [ ] **Step 1: Integrate dstack SDK and finish main.ts**
```typescript
import { DstackClient } from '@phala/dstack-sdk';
import crypto from 'crypto';

// ... (previous imports and playGame function)

async function signAndAttest(result: any) {
    try {
        const client = new DstackClient();
        const isReachable = await client.isReachable();
        if (!isReachable) {
            console.log('dstack service is not available, skipping attestation');
            return result;
        }

        const resultJson = JSON.stringify(result, Object.keys(result).sort());
        const hash = crypto.createHash('sha256').update(resultJson).digest();

        console.log(`Generating attestation for result hash: ${hash.toString('hex')}`);

        // Derive key
        const keyResult = await client.getKey('tournament-result');
        
        // Get quote
        const quoteResult = await client.getQuote(hash);

        result.attestation = {
            quote: quoteResult.quote,
            hash: hash.toString('hex'),
            signature: "mock-signature-using-derived-key"
        };
    } catch (e: any) {
        console.error(`Failed to generate attestation: ${e.message}`);
        result.attestation = { error: e.message };
    }
    return result;
}

if (require.main === module) {
    playGame()
        .then(signAndAttest)
        .then(finalResult => {
            console.log(`FINAL_RESULT: ${JSON.stringify(finalResult)}`);
            process.exit(0);
        })
        .catch(err => {
            console.error("Fatal error:", err);
            process.exit(1);
        });
}
```

- [ ] **Step 2: Commit**
```bash
git add tee-orchestrator/referee/main.ts
git commit -m "feat(referee): integrate dstack-sdk for attestation"
```

### Task 7: Dockerization & Orchestration Update

**Files:**
- Modify: `tee-orchestrator/agent-base/Dockerfile`
- Modify: `tee-orchestrator/referee/Dockerfile`
- Modify: `tee-orchestrator/docker-compose.template.yml`

- [ ] **Step 1: Update Agent-Base Dockerfile**
```dockerfile
FROM node:20-slim

WORKDIR /app
RUN apt-get update && apt-get install -y curl python3 build-essential && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

CMD ["npm", "start"]
```

- [ ] **Step 2: Update Referee Dockerfile**
```dockerfile
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx tsc

CMD ["npm", "start"]
```

- [ ] **Step 3: Update docker-compose.template.yml**
```yaml
version: '3.8'
services:
  referee:
    build: ./referee
    environment:
      - AGENT1_URL=http://agent1:8080/move
      - AGENT2_URL=http://agent2:8080/move
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
    depends_on:
      agent1:
        condition: service_started
      agent2:
        condition: service_started

  agent1:
    build: ./agent-base
    environment:
      - SCRIPT_HASH=${AGENT1_HASH}
    volumes:
      - agent1_data:/data
      - /var/run/dstack.sock:/var/run/dstack.sock

  agent2:
    build: ./agent-base
    environment:
      - SCRIPT_HASH=${AGENT2_HASH}
    volumes:
      - agent2_data:/data
      - /var/run/dstack.sock:/var/run/dstack.sock

volumes:
  agent1_data:
  agent2_data:
```

- [ ] **Step 4: Commit**
```bash
git add tee-orchestrator/agent-base/Dockerfile tee-orchestrator/referee/Dockerfile tee-orchestrator/docker-compose.template.yml
git commit -m "chore: update Dockerfiles and compose template for TS migration"
```

### Task 8: Cleanup

**Files:**
- Delete: `tee-orchestrator/agent-base/server.py`
- Delete: `tee-orchestrator/agent-base/requirements.txt`
- Delete: `tee-orchestrator/referee/main.py`
- Delete: `tee-orchestrator/referee/requirements.txt`

- [ ] **Step 1: Delete Python files**
Run: `rm tee-orchestrator/agent-base/server.py tee-orchestrator/agent-base/requirements.txt tee-orchestrator/referee/main.py tee-orchestrator/referee/requirements.txt`

- [ ] **Step 2: Commit**
```bash
git add tee-orchestrator/agent-base/server.py tee-orchestrator/agent-base/requirements.txt tee-orchestrator/referee/main.py tee-orchestrator/referee/requirements.txt
git commit -m "chore: remove legacy python files"
```
