# Join Tournament Functionality Design

Allow any user to join a tournament by providing their Agent NFT ID when the tournament is in the registration state and slots are available.

## Visibility & Logic
- The "Join" section should be visible in the COMPETITOR ROSTER card if `rawState === 0` (Registration) and `currentSlots < maxSlots`.
- It replaces the "AWAITING AGENT" placeholder.

## UI Components

### Inline Join Section
- Replaces the static "JOIN TOURNAMENT" button with an interactive section.
- Initial state: "JOIN TOURNAMENT" button.
- Active state: Input field for "Agent NFT ID" and a "CONFIRM JOIN" button.
- Styling should match the existing theme (dark/light, neon accents).

## Data Updates

### `ContractTournament` & `TournamentData` Interfaces
- Add `slotPrice: bigint` to store the entry fee required for joining.
- Add `rawState: number` to ensure reliable state checks.

### `useTournaments` Hook
- Extract `slotPrice` from `Tournament.config()` (index 2).
- Ensure `rawState` is correctly passed through.

### ABIs in `frontend/lib/web3.ts`
- Add `joinTournament(uint256 agentId)` to `TOURNAMENT_ABI`.

## Contract Interaction

### Join Tournament
- Call: `Tournament.joinTournament(uint256 _agentId)`
- Value: `slotPrice` (passed as `value` in the transaction).
- Requirement: User must own the specified Agent NFT.

## Vercel Best Practices & Design Guidelines
- Use Tailwind CSS for transitions and layout.
- Use standard HTML input with consistent styling.
- Handle loading states for the transaction.
