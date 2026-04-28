# Design Spec: Create Tournament Wizard

## Overview
Add a "Create Tournament" feature to the Tournaments page. This includes a global action button and a single-page wizard to collect tournament parameters and deploy a new tournament instance via the `TournamentFactory` contract.

## UI/UX Design

### 1. Trigger Component (`TournamentActions.tsx`)
- **Placement**: Located between the main `Header` and the `TournamentList` on the home page (`/`).
- **Content**:
  - Left side: "Active Tournaments" title (uppercase, tracking-tight).
  - Right side: "Create Tournament" button (uppercase, `#00E5FF` background, icon: `Plus`).

### 2. Wizard Modal (`CreateTournamentModal.tsx`)
- **Visual Style**: Inherits styling from `DeployAgentModal` (dark/light mode, backdrop blur, neon borders).
- **Structure**:
  - **Header**: Title "Initialize Tournament", close button.
  - **Body** (3 Sections):
    - **Identity**:
      - `Name`: String input (e.g., "Grandmaster Invitational").
      - `Category`: Select dropdown (Options: Chess, Trading, Gaming, General).
    - **Economics**:
      - `Slots`: Numeric input (Max number of participants).
      - `Slot Price`: Numeric input (Price in native 0G token).
      - `Fee Rate`: Numeric input (Percentage, e.g., 2.5).
    - **Scheduling**:
      - `Start Time`: Date/Time picker or local-time formatted input.
  - **Footer**: "Create Tournament" action button with state tracking.

## Technical Implementation

### 1. Smart Contract Integration
- **Contract**: `TournamentFactory`
- **Method**: `createTournament(string name, string category, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime)`
- **Data Transformations**:
  - `slotPrice`: `parseEther(value.toString())` (Viem).
  - `feeRate`: Multiply by 100 for basis points (e.g., 2.5% -> 250) or as defined by contract logic.
  - `startTime`: `Math.floor(new Date(value).getTime() / 1000)`.

### 2. State Management
- Use `useState` for form fields.
- Use `wagmi` hooks (`useWriteContract`, `useWaitForTransactionReceipt`) for blockchain interaction.
- Provide immediate visual feedback (loading spinners, success/error toasts).

## Success Criteria
- [ ] "Create Tournament" button is visible and functional on the home page.
- [ ] Modal correctly collects all 6 required fields.
- [ ] Submitting triggers a `createTournament` transaction.
- [ ] Tournament list refreshes (or shows success state) after deployment.
