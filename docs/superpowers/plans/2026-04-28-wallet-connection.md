# Wallet Connection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement wallet connection functionality in the frontend using RainbowKit and Wagmi, targeting the 0G Galileo Testnet.

**Architecture:** Centralized Web3 configuration in `lib/web3.ts`, global providers in `components/web3-provider.tsx`, and Header integration via RainbowKit's `ConnectButton`.

**Tech Stack:** `@rainbow-me/rainbowkit`, `wagmi`, `viem`, `@tanstack/react-query`

---

## File Mapping
- `frontend/lib/web3.ts`: Define custom chain and export wagmi config.
- `frontend/components/web3-provider.tsx`: Create a wrapper component for Web3 providers.
- `frontend/app/layout.tsx`: Integrate the `Web3Provider`.
- `frontend/components/header.tsx`: Integrate `ConnectButton`.
- `frontend/hooks/use-tournaments.ts`: Refactor to use wagmi hooks.

---

### Task 1: Install Dependencies

- [ ] **Step 1: Install RainbowKit, Wagmi, and React Query**
Run: `cd frontend && npm install @rainbow-me/rainbowkit wagmi @tanstack/react-query`

- [ ] **Step 2: Verify installation**
Check `package.json` for new dependencies.

- [ ] **Step 3: Commit**
```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "chore(deps): install rainbowkit, wagmi, and react-query"
```

---

### Task 2: Configure Web3 and Custom Chain

- [ ] **Step 1: Update `frontend/lib/web3.ts` with custom chain and wagmi config**
Modify: `frontend/lib/web3.ts`

```typescript
import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://evmrpc-testnet.0g.ai";
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const zeroGGalileo = defineChain({
  id: 16600,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://chainscan-testnet.0g.ai' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Deviant AI',
  projectId: 'YOUR_PROJECT_ID', // Replace with a real one or placeholder for now
  chains: [zeroGGalileo],
  ssr: true,
});

export const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(RPC_URL),
});

export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])'
]);

export const TOURNAMENT_ABI = parseAbi([
  'function config() external view returns (address owner, address tee, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime, uint256 id, string name, string category, string liveUri)',
  'function state() external view returns (uint8)',
  'function getAgentKeys() external view returns (uint256[])'
]);
```

- [ ] **Step 2: Commit**
```bash
git add frontend/lib/web3.ts
git commit -m "feat(web3): define 0G Galileo chain and wagmi config"
```

---

### Task 3: Create Web3 Provider

- [ ] **Step 1: Create `frontend/components/web3-provider.tsx`**
Create: `frontend/components/web3-provider.tsx`

```tsx
"use client";

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import {
  QueryClientProvider,
  QueryClient,
} from "@tanstack/react-query";
import { config } from '@/lib/web3';
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/components/web3-provider.tsx
git commit -m "feat(web3): add Web3Provider component"
```

---

### Task 4: Integrate Providers in Layout

- [ ] **Step 1: Update `frontend/app/layout.tsx` to include `Web3Provider`**
Modify: `frontend/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Web3Provider } from '@/components/web3-provider';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'Deviant AI',
  description: 'Autonomous AI agents competitions',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-[#F8FAFC] dark:bg-slate-950 text-[#131b2e] dark:text-slate-50 transition-colors duration-300" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <Web3Provider>
            {children}
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/app/layout.tsx
git commit -m "feat(layout): wrap app in Web3Provider"
```

---

### Task 5: Integrate ConnectButton in Header

- [ ] **Step 1: Update `frontend/components/header.tsx` to use RainbowKit's `ConnectButton`**
Modify: `frontend/components/header.tsx`

```tsx
"use client";

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  const pathname = usePathname();

  const isTournamentsActive = pathname === '/' || pathname.startsWith('/tournaments');
  const isAgentsActive = pathname.startsWith('/agents');

  return (
    <header className="fixed top-0 w-full h-16 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 md:px-8 font-display uppercase tracking-tighter transition-colors duration-300">
      {/* Left: Logo & Nav */}
      <div className="flex items-center gap-4 md:gap-12 h-full">
        <Link href="/" className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#131b2e] dark:text-white">
          DEVIANT AI
        </Link>
        <nav className="hidden md:flex gap-8 items-center h-full pt-1">
          <Link
            href="/"
            className={cn(
              "pb-1 h-full flex items-center font-medium transition-colors",
              isTournamentsActive ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF]'
            )}
          >
            Tournaments
          </Link>
          <Link
            href="/agents"
            className={cn(
              "pb-1 h-full flex items-center font-medium transition-colors",
              isAgentsActive ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF]'
            )}
          >
            Agents
          </Link>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="address" />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/components/header.tsx
git commit -m "feat(header): replace Connect Wallet button with RainbowKit ConnectButton"
```

---

### Task 6: Refactor useTournaments to use Wagmi

- [ ] **Step 1: Update `frontend/hooks/use-tournaments.ts` to use `useReadContract`**
Modify: `frontend/hooks/use-tournaments.ts`

```typescript
import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from '@/lib/web3';
import { TournamentStatus } from '@/components/tournament-card';

export interface ContractTournament {
  id: string;
  title: string;
  status: TournamentStatus;
  mainIcon: 'zap' | 'clock' | 'lock';
  category: string;
  mode: string;
  slots: string;
  timeLabel: string;
  timeValue: string;
  reward: string;
  rewardValue: number;
  closesAt: number;
  createdAt: number;
  address: string;
  liveUri: string;
  rawState: number;
  agentKeys: string[];
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<ContractTournament[]>([]);
  const [loading, setLoading] = useState(true);
  const publicClient = usePublicClient();

  const { data: addresses, isLoading: isAddressesLoading } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: TOURNAMENT_FACTORY_ABI,
    functionName: 'getTournaments',
  });

  useEffect(() => {
    async function fetchTournamentDetails() {
      if (!addresses || !publicClient) return;

      try {
        const results = await Promise.all((addresses as `0x${string}`[]).map(async (address) => {
          const config = await publicClient.readContract({
            address,
            abi: TOURNAMENT_ABI,
            functionName: 'config'
          }) as any;

          const state = await publicClient.readContract({
            address,
            abi: TOURNAMENT_ABI,
            functionName: 'state'
          }) as number;

          let agentKeys: bigint[] = [];
          try {
            agentKeys = await publicClient.readContract({
              address,
              abi: TOURNAMENT_ABI,
              functionName: 'getAgentKeys'
            }) as bigint[];
          } catch (e) {
            console.error("Failed to fetch agent keys", e);
          }

          const statusMap: Record<number, TournamentStatus> = {
            0: 'REGISTRATION',
            1: 'LIVE',
            2: 'FINISHED'
          };

          return {
            id: config[6].toString(),
            title: config[7],
            status: statusMap[state] || 'FINISHED',
            mainIcon: state === 1 ? 'zap' : state === 0 ? 'clock' : 'lock',
            category: config[8],
            mode: 'Solo',
            slots: `${agentKeys.length}/${config[3].toString()}`,
            timeLabel: state === 0 ? 'STARTS AT' : 'ENDED',
            timeValue: new Date(Number(config[5]) * 1000).toLocaleString(),
            reward: `${Number(1)} 0G`,
            rewardValue: Number(config[2]),
            closesAt: 0,
            createdAt: Number(config[6]) * 1000,
            address: address,
            liveUri: config[9],
            rawState: state,
            agentKeys: agentKeys.map(k => k.toString())
          } as ContractTournament;
        }));

        setTournaments(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (addresses) {
      fetchTournamentDetails();
    } else if (!isAddressesLoading) {
        setLoading(false);
    }
  }, [addresses, publicClient, isAddressesLoading]);

  return { tournaments, loading: loading || isAddressesLoading };
}
```

- [ ] **Step 2: Commit**
```bash
git add frontend/hooks/use-tournaments.ts
git commit -m "refactor(hooks): use wagmi hooks for fetching tournaments"
```
