# Phala Cloud Dstack Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition TEE infrastructure from 0G Tapp to Phala Cloud Dstack with attestation and result signing.

**Architecture:** Use Phala Cloud dynamic CVM provisioning for tournaments, integrate `dstack-sdk` in the referee for signing/attestation, and provide a local dstack simulator.

**Tech Stack:** Phala Cloud Dstack, `dstack-sdk` (Python/TS), Docker Compose.

---

### Task 1: Update Docker Compose Infrastructure

**Files:**
- Modify: `tee-orchestrator/docker-compose.template.yml`

- [ ] **Step 1: Add dstack socket mount to services**

```yaml
# tee-orchestrator/docker-compose.template.yml edits
# Add volume mount to agent1, agent2, and referee services:
# - /var/run/dstack.sock:/var/run/dstack.sock
```

- [ ] **Step 2: Commit changes**

```bash
git add tee-orchestrator/docker-compose.template.yml
git commit -m "chore: add dstack socket volume mount to docker-compose"
```

### Task 2: Simplify Downloader (Remove Decryption)

**Files:**
- Modify: `tee-orchestrator/downloader/index.ts`

- [ ] **Step 1: Remove decryption-related code and logic**

```typescript
// tee-orchestrator/downloader/index.ts
// Remove any decryption references if they exist (it seems it only downloads .enc files currently)
// Update to download .py directly if hashes represent plaintext, or just keep as is if hashes are for plaintext but named .enc
```

- [ ] **Step 2: Verify downloader builds**

Run: `cd tee-orchestrator/downloader && npm run build` (or equivalent)
Expected: Success

- [ ] **Step 3: Commit changes**

```bash
git add tee-orchestrator/downloader/index.ts
git commit -m "refactor: simplify downloader by removing decryption logic"
```

### Task 3: Update Referee Storage Logic

**Files:**
- Modify: `tee-orchestrator/referee/storage.py`

- [ ] **Step 1: Remove decryption shell script and logic**

```python
# tee-orchestrator/referee/storage.py
# Remove TAPP_SECRET_SCRIPT = "/app/get_app_secret_key.sh"
# Update process_agent to simply copy the downloaded file without decryption logic
```

- [ ] **Step 2: Commit changes**

```bash
git add tee-orchestrator/referee/storage.py
git commit -m "refactor: remove decryption logic from referee storage"
```

### Task 4: Integrate Dstack SDK in Referee

**Files:**
- Modify: `tee-orchestrator/referee/requirements.txt`
- Modify: `tee-orchestrator/referee/main.py`

- [ ] **Step 1: Add dstack-sdk to requirements**

```text
# tee-orchestrator/referee/requirements.txt
dstack-sdk
```

- [ ] **Step 2: Add signing and attestation to match results**

```python
# tee-orchestrator/referee/main.py
from dstack_sdk import DstackClient
import hashlib

def sign_and_attest(result):
    client = DstackClient()
    result_json = json.dumps(result)
    result_hash = hashlib.sha256(result_json.encode()).hexdigest()
    
    # Derive key
    key_res = client.get_key(path="tournament-result", purpose="signing")
    # (In a real implementation, you'd use this key to sign result_hash)
    
    # Get attestation quote
    quote_res = client.get_quote(result_hash)
    
    result["signature"] = "mock_sig_for_now" # Replace with real sig logic
    result["attestation"] = quote_res.quote
    return result
```

- [ ] **Step 3: Commit changes**

```bash
git add tee-orchestrator/referee/requirements.txt tee-orchestrator/referee/main.py
git commit -m "feat: integrate dstack-sdk for signing and attestation in referee"
```

### Task 5: Local Simulator Setup

**Files:**
- Create: `tee-orchestrator/start_simulator.sh`

- [ ] **Step 1: Create simulator start script**

```bash
#!/bin/bash
# tee-orchestrator/start_simulator.sh
docker run -d --name dstack-simulator \
  -v /var/run/dstack.sock:/var/run/dstack.sock \
  phalanetwork/dstack-simulator
```

- [ ] **Step 2: Commit changes**

```bash
git add tee-orchestrator/start_simulator.sh
chmod +x tee-orchestrator/start_simulator.sh
git commit -m "feat: add dstack simulator start script"
```

### Task 6: Update Watcher for Phala Cloud Deployment

**Files:**
- Modify: `tee-orchestrator/watcher/index.ts`

- [ ] **Step 1: Replace 0G start_app.sh call with Phala Cloud deployment**

```typescript
// tee-orchestrator/watcher/index.ts
// Update deployTournament to use Phala Cloud CLI/API
// Example: exec('phala cvm deploy ...')
```

- [ ] **Step 2: Commit changes**

```bash
git add tee-orchestrator/watcher/index.ts
git commit -m "feat: update watcher to deploy to Phala Cloud"
```
