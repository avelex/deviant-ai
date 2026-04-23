# TEE Chess Orchestrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a TEE-compatible orchestrator for Unreal AI Tournament that manages AI agent deployment in 0G Tapp, runs a chess match, and logs results.

**Architecture:** A Node.js external watcher listens for on-chain events and triggers a Docker Compose deployment. Inside 0G Tapp, a Python referee manages the game state using `python-chess` and queries two isolated HTTP-based agent containers for moves.

**Tech Stack:** Python 3.10+, `python-chess`, FastAPI, Docker, Node.js/TypeScript, ethers.js

---

### Task 1: Setup Agent Base Image

**Files:**
- Create: `tee-orchestrator/agent-base/requirements.txt`
- Create: `tee-orchestrator/agent-base/server.py`
- Create: `tee-orchestrator/agent-base/Dockerfile`

- [ ] **Step 1: Write requirements.txt**

```text
fastapi==0.104.1
uvicorn==0.24.0.post1
```

- [ ] **Step 2: Write the HTTP server wrapper**

```python
import os
import sys
import importlib.util
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class MoveRequest(BaseModel):
    fen: str

# Expected location of the decrypted agent script mounted by the referee
AGENT_SCRIPT_PATH = "/shared/agent.py"

@app.post("/move")
def get_move(req: MoveRequest):
    if not os.path.exists(AGENT_SCRIPT_PATH):
        raise HTTPException(status_code=500, detail="Agent script not found")
    
    try:
        spec = importlib.util.spec_from_file_location("agent_module", AGENT_SCRIPT_PATH)
        agent_module = importlib.util.module_from_spec(spec)
        sys.modules["agent_module"] = agent_module
        spec.loader.exec_module(agent_module)
        
        if not hasattr(agent_module, "get_move"):
            raise HTTPException(status_code=500, detail="get_move function not found in agent script")
            
        move = agent_module.get_move(req.fen)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
```

- [ ] **Step 3: Write the Dockerfile**

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py .

CMD ["python", "server.py"]
```

- [ ] **Step 4: Commit**

```bash
git add tee-orchestrator/agent-base/
git commit -m "feat: add agent base container for TEE execution"
```

### Task 2: Setup Referee Game Logic

**Files:**
- Create: `tee-orchestrator/referee/requirements.txt`
- Create: `tee-orchestrator/referee/main.py`

- [ ] **Step 1: Write requirements.txt**

```text
chess==1.10.0
requests==2.31.0
```

- [ ] **Step 2: Write the Referee main game loop**

```python
import os
import time
import json
import logging
import requests
import chess

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AGENT1_URL = os.environ.get("AGENT1_URL", "http://agent1:8080/move")
AGENT2_URL = os.environ.get("AGENT2_URL", "http://agent2:8080/move")
MOVE_TIMEOUT = 60

def request_move(url: str, fen: str) -> str:
    try:
        resp = requests.post(url, json={"fen": fen}, timeout=MOVE_TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("move")
    except requests.exceptions.RequestException as e:
        logger.error(f"Error requesting move from {url}: {e}")
        return None

def play_game():
    board = chess.Board()
    logger.info("Starting chess match")
    
    # Wait for agents to start
    time.sleep(5)
    
    while not board.is_game_over():
        current_turn = board.turn
        url = AGENT1_URL if current_turn == chess.WHITE else AGENT2_URL
        player_name = "Agent 1 (White)" if current_turn == chess.WHITE else "Agent 2 (Black)"
        
        logger.info(f"Turn: {player_name}")
        move_str = request_move(url, board.fen())
        
        if not move_str:
            logger.info(f"{player_name} failed to return a move. Game over.")
            winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
            return {"winner": winner, "reason": "timeout_or_error", "pgn": board.fen()}
            
        try:
            move = chess.Move.from_uci(move_str)
            if move not in board.legal_moves:
                logger.info(f"{player_name} made illegal move {move_str}. Game over.")
                winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
                return {"winner": winner, "reason": "illegal_move", "pgn": board.fen()}
                
            board.push(move)
            logger.info(f"Move played: {move_str}")
        except Exception as e:
            logger.info(f"{player_name} returned invalid move format {move_str}: {e}. Game over.")
            winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
            return {"winner": winner, "reason": "invalid_format", "pgn": board.fen()}
            
    # Game ended normally
    result = board.result()
    winner = "Draw"
    if result == "1-0":
        winner = "Agent 1"
    elif result == "0-1":
        winner = "Agent 2"
        
    logger.info(f"Game finished. Result: {result}")
    return {"winner": winner, "reason": "normal", "pgn": board.fen()}

if __name__ == "__main__":
    # In a real run, this is where storage.py decrypts and mounts scripts
    result = play_game()
    print(f"FINAL_RESULT: {json.dumps(result)}")
```

- [ ] **Step 3: Commit**

```bash
git add tee-orchestrator/referee/
git commit -m "feat: add referee game loop logic"
```

### Task 3: Setup Referee Storage & Decryption Mock

**Files:**
- Create: `tee-orchestrator/referee/storage.py`
- Create: `tee-orchestrator/referee/Dockerfile`
- Create: `tee-orchestrator/docker-compose.template.yml`

- [ ] **Step 1: Write storage logic**

```python
import os
import shutil
import logging
import subprocess

logger = logging.getLogger(__name__)

# In 0G Tapp, this script is available inside the container environment
TAPP_SECRET_SCRIPT = "/app/get_app_secret_key.sh"

def setup_agent_scripts():
    logger.info("Setting up agent scripts...")
    agent1_hash = os.environ.get("AGENT1_HASH")
    agent2_hash = os.environ.get("AGENT2_HASH")
    
    if not agent1_hash or not agent2_hash:
        logger.warning("Agent hashes not provided, assuming dev mode")
        return
        
    # TODO: Real 0G Storage download and decryption using Tapp secret key
    # For MVP execution structure, we mock placing files in shared volume
    # Real implementation would call TAPP_SECRET_SCRIPT, decrypt AES keys, then decrypt agent scripts
    logger.info("Downloading and decrypting scripts...")
    
    # Write mock agents to shared volumes
    os.makedirs("/shared/agent1", exist_ok=True)
    os.makedirs("/shared/agent2", exist_ok=True)
    
    # Mock agent that plays a random legal move
    mock_agent_code = """
import chess
import random
def get_move(fen: str) -> str:
    board = chess.Board(fen)
    moves = list(board.legal_moves)
    return moves[0].uci() if moves else ""
"""
    with open("/shared/agent1/agent.py", "w") as f:
        f.write(mock_agent_code)
    with open("/shared/agent2/agent.py", "w") as f:
        f.write(mock_agent_code)
        
    logger.info("Agent scripts mounted to shared volumes")

if __name__ == "__main__":
    setup_agent_scripts()
```

- [ ] **Step 2: Update Referee main.py to call storage**

```bash
sed -i.bak 's/# In a real run, this is where storage.py decrypts and mounts scripts/import storage\n    storage.setup_agent_scripts()/' tee-orchestrator/referee/main.py
```

- [ ] **Step 3: Write Referee Dockerfile**

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY storage.py .
COPY main.py .

CMD ["python", "main.py"]
```

- [ ] **Step 4: Write Docker Compose Template**

```yaml
version: '3.8'
services:
  referee:
    build: ./referee
    environment:
      - AGENT1_URL=http://agent1:8080/move
      - AGENT2_URL=http://agent2:8080/move
      - AGENT1_HASH=${AGENT1_HASH}
      - AGENT2_HASH=${AGENT2_HASH}
    volumes:
      - agent1_data:/shared/agent1
      - agent2_data:/shared/agent2
    depends_on:
      - agent1
      - agent2

  agent1:
    build: ./agent-base
    volumes:
      - agent1_data:/shared:ro

  agent2:
    build: ./agent-base
    volumes:
      - agent2_data:/shared:ro

volumes:
  agent1_data:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
  agent2_data:
    driver: local
    driver_opts:
      type: tmpfs
      device: tmpfs
```

- [ ] **Step 5: Commit**

```bash
git add tee-orchestrator/referee/ tee-orchestrator/docker-compose.template.yml
git commit -m "feat: add referee storage logic and compose template"
```

### Task 4: Setup External Watcher (Node.js)

**Files:**
- Create: `tee-orchestrator/watcher/package.json`
- Create: `tee-orchestrator/watcher/tsconfig.json`
- Create: `tee-orchestrator/watcher/index.ts`

- [ ] **Step 1: Write package.json and tsconfig.json**

```json
{
  "name": "tee-watcher",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "ts-node index.ts"
  },
  "dependencies": {
    "ethers": "^6.8.1"
  },
  "devDependencies": {
    "@types/node": "^20.8.10",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "commonjs",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2: Write Watcher logic**

```typescript
import { spawn } from 'child_process';
import * as path from 'path';

const TAPP_EXAMPLES_DIR = path.resolve(__dirname, '../../../.references/og-tapp/examples');

async function deployTournament(agent1Hash: string, agent2Hash: string): Promise<string> {
    console.log(`Deploying tournament for agents: ${agent1Hash} vs ${agent2Hash}`);
    
    // In reality, we'd copy template and replace env vars
    const composePath = path.resolve(__dirname, '../docker-compose.template.yml');
    
    return new Promise((resolve, reject) => {
        // We use the start_app.sh script from og-tapp reference
        const script = path.join(TAPP_EXAMPLES_DIR, 'start_app.sh');
        
        // Mock environment variables that would normally be set by the caller
        const env = {
            ...process.env,
            TAPP_OWNER_PRIVATE_KEY: process.env.TAPP_OWNER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001",
            AGENT1_HASH: agent1Hash,
            AGENT2_HASH: agent2Hash
        };

        const args = [
            '--host', 'localhost',
            '--port', '50051',
            '--app-id', `chess-tourney-${Date.now()}`,
            '--compose-file', composePath,
            '--use-owner'
        ];

        console.log(`Executing: ${script} ${args.join(' ')}`);
        
        // MVP: We log instead of executing to prevent needing a running TAPP instance
        console.log("Mock TAPP Deployment Successful. Task ID: mock-task-123");
        resolve("mock-task-123");
        
        /* Real implementation:
        const child = spawn(script, args, { env });
        
        let output = '';
        child.stdout.on('data', (data) => output += data.toString());
        child.stderr.on('data', (data) => console.error(data.toString()));
        
        child.on('close', (code) => {
            if (code !== 0) return reject(new Error(`Tapp deployment failed: ${code}`));
            // Parse output for Task ID
            const match = output.match(/Task ID:\s*([a-zA-Z0-9-]+)/);
            if (match) resolve(match[1]);
            else resolve("unknown-task-id");
        });
        */
    });
}

async function main() {
    console.log("Watcher started, listening for events...");
    // MVP: Simulate event trigger
    setTimeout(async () => {
        const taskId = await deployTournament("hashA123", "hashB456");
        console.log(`Tournament deployed. Monitoring task: ${taskId}`);
        // Here we would poll get_task_status.sh, then get_app_log.sh, then submit to contract
    }, 2000);
}

main().catch(console.error);
```

- [ ] **Step 3: Commit**

```bash
git add tee-orchestrator/watcher/
git commit -m "feat: add watcher service skeleton"
```

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-23-tee-orchestrator.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
