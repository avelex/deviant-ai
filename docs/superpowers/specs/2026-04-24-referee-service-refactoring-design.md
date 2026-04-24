# Unreal AI Tournament: Referee Service Refactoring (Watcher + Downloader + Referee)

## Overview
This document specifies the architecture for refactoring the Referee Service of the Unreal AI Tournament. The system orchestrates ИИ-agent chess matches inside a Trusted Execution Environment (TEE) powered by 0G Tapp.

The core problem being solved is securely executing untrusted user-submitted Python scripts (`agent.py`) while maintaining the integrity of the match result.

## Architecture

We are moving from a combined/unspecified model to a **Unified Codebase, Split Execution** model featuring the "Init Container" pattern for maximum security.

The system consists of three distinct logical components:
1.  **Watcher (Host Environment):** A TypeScript service running outside the TEE. It listens to the blockchain, orchestrates the Tapp deployment, and resolves the tournament on-chain.
2.  **Downloader (TEE Init Container):** A lightweight, ephemeral Node.js container running *inside* the TEE. Its sole purpose is to securely fetch encrypted files from 0G Storage directly into TEE memory, bypassing the host.
3.  **Referee (TEE Execution Container):** A Python service running *inside* the TEE. It waits for the Downloader to finish, decrypts the scripts using the Tapp Secret, orchestrates the `python-chess` game loop against isolated agent containers, and logs the result.

### 1. Watcher (Host)
*   **Tech Stack:** TypeScript, `viem` (replacing `ethers` for performance and DX).
*   **Responsibilities:**
    *   Listen for `TournamentStarted` events on the `TournamentFactory` contract.
    *   Read the `Tournament` contract to get participating Agent IDs (iNFTs).
    *   Read the `AgentNFT` contract to extract the `ScriptRootHash` and `ScriptKeyRootHash` for each agent from their `IntelligentData`.
    *   Generate a `docker-compose.yml` for the specific match. Crucially, this compose file passes the Root Hashes as **environment variables** to the TEE containers. It does *not* mount local files.
    *   Execute `start_app.sh` (0G Tapp CLI) to deploy the generated compose file into the TEE.
    *   Poll the Tapp logs (via task ID or Tapp API) to find the final match result.
    *   Submit the `resolveTournament(winnerId)` transaction on-chain.

### 2. Downloader (TEE Init)
*   **Tech Stack:** Node.js, `@0gfoundation/0g-ts-sdk`.
*   **Responsibilities:**
    *   Starts automatically when the Tapp boots.
    *   Reads `AGENT1_HASH` and `AGENT2_HASH` from environment variables.
    *   Uses the 0G TS SDK to download the encrypted scripts directly from 0G Storage nodes.
    *   Writes the encrypted payloads to a shared `tmpfs` volume (e.g., `/shared/encrypted/agent1.py.enc`).
    *   Exits with status `0` upon success.

### 3. Referee (TEE Execution)
*   **Tech Stack:** Python, `python-chess`, `requests`.
*   **Responsibilities:**
    *   `depends_on: downloader` in docker-compose (waits for successful download).
    *   Executes `/app/get_app_secret_key.sh` to retrieve the 0G Tapp private key.
    *   *(MVP Scope)* Decrypts the files found in `/shared/encrypted/` and moves the executable `agent.py` scripts to `/shared/agent1/` and `/shared/agent2/`.
    *   Waits for `agent1` and `agent2` HTTP servers to become healthy.
    *   Executes the standard chess loop, sending FEN strings to the agents and validating their UCI responses.
    *   Outputs the final result as a structured JSON log to `stdout` (e.g., `FINAL_RESULT: {"winner": "Agent 1", "reason": "checkmate", "pgn": "..."}`).

## Data Flow
1. `TournamentStarted` -> Watcher -> Fetch Hashes.
2. Watcher -> Generate Compose -> `start_app.sh`.
3. TEE boots -> Downloader runs -> Fetches from 0G -> Writes to `/shared` -> Exits.
4. Referee boots -> Decrypts `/shared` -> Mounts to Agents -> Starts Agents.
5. Game Loop runs -> Referee logs `FINAL_RESULT`.
6. Watcher reads logs -> `resolveTournament` tx.

## Security Considerations
*   **Malicious Deployer Protection:** By using the Downloader init container, the encrypted agent scripts are never downloaded to the host machine running the Watcher. The host cannot inspect or tamper with the payloads before they enter the TEE.
*   **Agent Isolation:** The untrusted `agent.py` scripts run in separate, isolated Docker containers without access to the Tapp Secret Key or the network.
