# Design Spec: Wallet Connection with RainbowKit & Wagmi

## 1. Overview
Implement a robust wallet connection system for the Deviant AI frontend using RainbowKit and Wagmi. This will enable users to connect their wallets, interact with the 0G Galileo Testnet, and eventually participate in tournaments and manage agents.

## 2. Technical Stack
- **Library**: `@rainbow-me/rainbowkit` (UI/Modal)
- **Framework**: `wagmi` (Hooks/State)
- **Engine**: `viem` (Low-level primitives)
- **State Management**: `@tanstack/react-query` (Internal wagmi state)

## 3. Architecture

### 3.1 Chain Definition (0G Galileo Testnet)
Define a custom chain in `frontend/lib/web3.ts`:
- **ID**: 16600
- **Name**: 0G Galileo Testnet
- **RPC**: `https://evmrpc-testnet.0g.ai` (or env fallback)
- **Currency**: 0G
- **Explorer**: `https://chainscan-testnet.0g.ai`

### 3.2 Global Providers
Create a new component `frontend/components/web3-provider.tsx` to wrap the application:
- `QueryClientProvider`
- `WagmiProvider`
- `RainbowKitProvider` (configured to follow system theme)

### 3.3 Configuration
Centralize config in `frontend/lib/web3-config.ts` using `getDefaultConfig` from RainbowKit.

## 4. UI Integration

### 4.1 Header Update
Replace the static "Connect Wallet" button in `frontend/components/header.tsx` with RainbowKit's `ConnectButton`.
- Keep the existing minimalist, sharp-edged aesthetic for the button container where possible.
- Use `ConnectButton.Custom` if the default RainbowKit button styling deviates too much from the design language.

### 4.2 Conditional Rendering
Update action buttons (e.g., "Join Tournament", "Deploy Agent") to:
- Check connection status using `useAccount`.
- Show "Connect Wallet" if disconnected.
- Trigger transaction or modal if connected.

## 5. Data Fetching Migration
Update `useTournaments` hook:
- Replace raw `publicClient.readContract` calls with wagmi's `useReadContract` or `useReadContracts` for reactivity and better integration with the React lifecycle.

## 6. Implementation Plan Highlights
1. Install dependencies.
2. Define 0G Galileo chain and Wagmi config.
3. Create and integrate `Web3Provider`.
4. Update `Header` with `ConnectButton`.
5. Refactor `useTournaments` to use wagmi hooks.
6. Verify connection and contract reading on testnet.
