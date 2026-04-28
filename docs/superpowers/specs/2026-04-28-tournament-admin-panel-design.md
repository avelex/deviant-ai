# Admin Panel for Tournament Page Design

Add an Admin Panel to the tournament detail page that allows the tournament owner to configure the TEE address and Live URI.

## Visibility
- The Admin Panel must only be visible if the connected wallet address is the owner of the tournament.
- Ownership is verified by comparing `Tournament.config.owner` with the connected address from `useAccount`.

## Components

### `AdminPanel` Component
- Location: `frontend/components/admin-panel.tsx`
- Props:
  - `tournamentAddress`: The address of the Tournament contract.
  - `ownerAddress`: The address of the tournament owner.
- UI:
  - Single card styled like "COMPETITOR ROSTER".
  - Two sections: "Set Tee address" and "Set Live URI".
  - Standard text inputs for both fields.
  - Action buttons that trigger contract writes.

## Data Updates

### `ContractTournament` & `TournamentData` Interfaces
- Add `owner: string` and `address: string` to these interfaces to ensure the owner check and contract calls can be performed.

### `useTournaments` Hook
- Update `useTournaments` to extract and return the `owner` address from the `Tournament.config()` call.

### ABIs in `frontend/lib/web3.ts`
- Add `setTournamentTee` to `TOURNAMENT_FACTORY_ABI`.
- Add `setLiveUri` to `TOURNAMENT_ABI`.

## Contract Interactions

### Set TEE Address
- Call: `TournamentFactory.setTournamentTee(address _tournament, address _tee)`
- Requirement: Connected wallet must be a referee in the Factory (usually the owner in demo setups).

### Set Live URI
- Call: `Tournament.setLiveUri(string calldata _liveUri)`
- Requirement: Connected wallet must be the tournament owner.

## Vercel Best Practices & Design Guidelines
- Use Tailwind CSS for styling.
- Follow the existing dark/light theme patterns.
- Ensure responsive layout (fits in the right column on desktop).
- Use `lucide-react` for icons if needed.
