# Tournament Totalizator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the betting deadlock and incorrect reward distribution in `Tournament.sol` while adding a robust test suite.

**Architecture:**
1.  **Data Refactoring:** Move from global betting totals to per-user, per-agent tracking.
2.  **State Machine Decoupling:** Separate the betting window from the "Active" game state.
3.  **Precise Accounting:** Calculate and distribute rewards for the Organizer, Winner, and Bettors using the "Checks-Effects-Interactions" pattern.

**Tech Stack:** Solidity 0.8.20, Foundry (Forge)

---

### Task 1: Setup Reproduction Test Suite

**Files:**
- Create: `test/Tournament.t.sol`

- [ ] **Step 1: Create the base test file with setup**
Initialize `Tournament`, `TournamentFactory`, and `MockNFT`.

- [ ] **Step 2: Add `testFail_BettingDeadlock`**
Demonstrate that `placeBet` fails when `state == Registration` or when `block.timestamp < startedAt` while `state == Active`.

- [ ] **Step 3: Add `testFail_IncorrectBettorPayout`**
Demonstrate that a bettor can currently claim rewards without backing the winner.

- [ ] **Step 4: Run tests to verify failures**
Run: `forge test --match-path test/Tournament.t.sol`
Expected: Tests should fail as expected.

- [ ] **Step 5: Commit**

### Task 2: Refactor Data Structures and Betting Logic

**Files:**
- Modify: `src/Tournament.sol`

- [ ] **Step 1: Update state variables**
```solidity
mapping(address => mapping(uint256 => uint256)) public userBetsOnAgent;
mapping(address => uint256) public totalUserBets;
mapping(address => uint256) public slotsJoinedByUser;
```

- [ ] **Step 2: Update `joinTournament`**
Increment `slotsJoinedByUser[msg.sender]`.

- [ ] **Step 3: Update `placeBet`**
```solidity
function placeBet(uint256 _agentId) external payable {
    require(state == ITournament.State.Registration, "Registration closed");
    require(block.timestamp < config.startedAt, "Betting window closed");
    require(msg.value > 0, "Bet must be > 0");
    require(agents.contains(_agentId), "Agent not in tournament");

    userBetsOnAgent[msg.sender][_agentId] += msg.value;
    totalUserBets[msg.sender] += msg.value;
    totalBetsPool += msg.value;
    totalBetsOnAgent[_agentId] += msg.value;
}
```

- [ ] **Step 4: Update `startTournament`**
Remove requirements about time if they conflict with `placeBet`, or ensure it only transitions state.

- [ ] **Step 5: Run tests**
`testFail_BettingDeadlock` should now pass (if renamed to `test_BettingWorks`).

- [ ] **Step 6: Commit**

### Task 3: Implement Correct Reward and Refund Logic

**Files:**
- Modify: `src/Tournament.sol`

- [ ] **Step 1: Refactor `claimRewards`**
Implement logic for:
- Organizer fee (if `msg.sender == config.owner`).
- Winner reward (if `msg.sender` owns `winnerAgentId`).
- Bettor reward (proportional based on `userBetsOnAgent[msg.sender][winnerAgentId]`).
- Refunds for `noWinner` case using `totalUserBets` and `slotsJoinedByUser`.

- [ ] **Step 2: Add validation tests in `test/Tournament.t.sol`**
- `test_ClaimOrganizerFee`
- `test_ClaimWinnerReward`
- `test_ClaimBettorReward`
- `test_ClaimNoWinnerRefund`

- [ ] **Step 3: Run all tests**
Run: `forge test -vvv`

- [ ] **Step 4: Commit**

### Task 4: Final Verification and Cleanup

**Files:**
- Modify: `src/Tournament.sol`

- [ ] **Step 1: Add Reentrancy Guard**
Import and apply `ReentrancyGuard` to `claimRewards`.

- [ ] **Step 2: Ensure Events are Emitted**
Verify `TournamentStarted`, `TournamentResolved`, and potentially add a `RewardClaimed` event.

- [ ] **Step 3: Final Gas Audit**
Check if `claimRewards` is efficient enough for users with many bets.

- [ ] **Step 4: Commit**
