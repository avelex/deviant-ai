# Display All Parameters in Configuration Design

Extend the Configuration modal in the Tournament Detail page to display all tournament parameters, including technical fields like Slot Price, Max Slots, Owner, and TEE address.

## UI Components

### `TournamentDetail` Component
- Modify the Configuration modal JSX.
- Keep the existing "General Parameters" grid (Category, Type, Duration, Reward).
- Add a new "Technical Parameters" section below the existing grid.
- Use a similar grid or list layout for technical fields:
  - **Slot Price**: Displayed in ETH/0G.
  - **Max Slots**: Total capacity.
  - **Owner**: Truncated address with copy or link to explorer.
  - **TEE Address**: Truncated address (if set, otherwise "Not Set").

## Data Updates

### `TournamentData` Interface
- Ensure all necessary fields are optional or required in the interface.

### `TournamentPage` Mapping
- Update the mapping in `frontend/app/tournaments/[id]/page.tsx` to pass through all available data from `activeTournament`.

## Vercel Best Practices & Design Guidelines
- Maintain visual hierarchy by grouping related fields.
- Use consistent typography and spacing from the existing design.
- Ensure the modal remains scrollable and responsive.
