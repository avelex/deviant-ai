# Add Odds View Function Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a view function `getOdds(uint256 _agentId)` to `Tournament.sol` that returns the current betting multiplier for a specific agent.

**Architecture:**
- Scale the result by `1e18` to represent decimals.
- Formula: `(Net Betting Pool * 1e18) / Total Bets on Agent`.
- Handle the case where an agent has zero bets (return 0 or a very high value; returning 0 is safer for frontend handling).

**Tech Stack:** Solidity 0.8.20, Foundry

---

### Task 1: Update Interface and Implementation

**Files:**
- Modify: `src/interfaces/ITournament.sol`
- Modify: `src/Tournament.sol`

- [ ] **Step 1: Add `getOdds` to `ITournament.sol`**
```solidity
function getOdds(uint256 agentId) external view returns (uint256);
```

- [ ] **Step 2: Implement `getOdds` in `Tournament.sol`**
```solidity
function getOdds(uint256 _agentId) public view returns (uint256) {
    if (totalBetsOnAgent[_agentId] == 0) {
        return 0;
    }
    uint256 netBetsPool = totalBetsPool - ((totalBetsPool * config.feeRate) / FEE_RATE_MAX_BPS);
    return (netBetsPool * 1e18) / totalBetsOnAgent[_agentId];
}
```

- [ ] **Step 3: Add test case to `test/Tournament.t.sol`**
Verify the calculation for different bet ratios.

- [ ] **Step 4: Run tests**
`forge test --match-path test/Tournament.t.sol`

- [ ] **Step 5: Commit**
```bash
git add src/Tournament.sol src/interfaces/ITournament.sol test/Tournament.t.sol
git commit -m "feat: add getOdds view function to Tournament"
```
