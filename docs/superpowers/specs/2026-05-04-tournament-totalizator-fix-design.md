# Tournament Totalizator Fix Design

## Goal
Fix critical logical errors in the `Tournament.sol` betting and reward distribution system, including a betting deadlock and incorrect pool accounting.

## Problem Statement
1.  **Betting Deadlock:** `placeBet` requires the state to be `Active`, but `startTournament` (which sets the state to `Active`) requires `block.timestamp >= startedAt`. However, `placeBet` also requires `block.timestamp < startedAt`. This makes it impossible to place any bets.
2.  **Incomplete Betting Data:** The `bets` mapping only tracks the total amount a user bet, not *which* agent they bet on. This prevents proportional payout based on winning bets.
3.  **Reward Misallocation:** Currently, the tournament owner receives both the organizer fee and the entry fees. The design must ensure the winner of the tournament receives the net entry fees.

## Proposed Changes

### 1. Data Structures
*   **Bet Tracking:** Replace `mapping(address => uint256) public bets` with `mapping(address => mapping(uint256 => uint256)) public userBetsOnAgent`.
*   **Total User Betting:** Add `mapping(address => uint256) public totalUserBets` to track a user's total exposure across all agents.
*   **Agent Participation Tracking:** Add `mapping(address => uint256) public slotsJoinedByUser` to avoid gas-heavy loops during refunds.

### 2. State Machine & Betting Window
*   **`placeBet`:**
    *   Allowed in `Registration` state.
    *   Requirement: `block.timestamp < config.startedAt`.
    *   Requirement: `agents.contains(_agentId)`.
*   **`startTournament`:**
    *   Allowed when `block.timestamp >= config.startedAt`.
    *   Transitions state to `Active`.
    *   Closes the registration and betting window permanently.

### 3. Payout Logic (`claimRewards`)

The `organizerFee` is deducted from the gross pools. Payouts are as follows:

| Recipient | Logic |
| :--- | :--- |
| **Organizer** | `(totalEntryFees + totalBetsPool) * feeRate / 10000` (Only if `msg.sender == config.owner`) |
| **Winner (Agent Owner)** | `totalEntryFees - (totalEntryFees * feeRate / 10000)` (Goes to the address that joined with the winning agent) |
| **Winning Bettors** | Proportional share of `totalBetsPool - (totalBetsPool * feeRate / 10000)` |

#### Formula for Winning Bettor (User A):
`Reward = (userBetsOnAgent[User A][winnerAgentId] * NetBetsPool) / totalBetsOnAgent[winnerAgentId]`

### 4. Refund Logic (`noWinner == true`)
In case of a draw or cancellation:
*   Bettors receive 100% refund of their `totalUserBets`.
*   Agent Owners receive 100% refund of `slotsJoinedByUser[msg.sender] * config.slotPrice`.
*   Organizer receives 0 fee.

## Security Considerations
*   **Reentrancy:** Use the "Checks-Effects-Interactions" pattern or a reentrancy guard for `claimRewards`.
*   **Rounding:** Payout calculations use multiplication before division to maintain precision. Any dust remaining in the contract due to rounding will stay in the contract (or can be collected by the organizer in a separate function).

## Testing Strategy
1.  **Reproduction Test:** Create a test case that attempts to bet after registration but before start, demonstrating the current deadlock.
2.  **Betting Validation:** Verify `userBetsOnAgent` updates correctly for multiple users and multiple agents.
3.  **Payout Validation:**
    *   Test standard win: Verify organizer, winner, and correct bettors get paid.
    *   Test no-winner: Verify full refunds to all participants.
    *   Test precision: Verify proportional payouts with non-uniform bet amounts.
