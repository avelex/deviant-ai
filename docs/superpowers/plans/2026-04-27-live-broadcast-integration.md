# Live Broadcast and Tournament Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate viem to fetch live tournaments from the `TournamentFactory` smart contract, extract the `liveUri` from each `Tournament` config, and use WebSocket to display real-time chess games on the Live Broadcast panel.

**Architecture:** 
1. The `frontend` will use `viem` to communicate with the 0G Testnet (or local node) to fetch all tournaments and their configurations.
2. In the `TournamentList` view, we will display dynamically fetched tournaments instead of mock data.
3. In the `TournamentDetail` view, if a tournament has `state = Active` (State value `1`), the UI will connect to the `liveUri` via WebSocket.
4. Using `chess.js` for game logic and `react-chessboard` for UI, the incoming WebSocket moves (`{"agent": "6", "move": "e2e4"}`) will visually update the board.

**Tech Stack:** Next.js (App router), React, viem, chess.js, react-chessboard.

---

### Task 1: Install Dependencies

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: Install viem, chess.js, and react-chessboard**
```bash
cd frontend
npm install viem chess.js react-chessboard
```

- [ ] **Step 2: Verify installation**
```bash
cat frontend/package.json | grep viem
```
Expected: `viem` in dependencies.

### Task 2: Configure Viem and Smart Contract ABIs

**Files:**
- Create: `frontend/lib/web3.ts`

- [ ] **Step 1: Define the `publicClient` and ABI in `frontend/lib/web3.ts`**
```typescript
import { createPublicClient, http, parseAbi } from 'viem';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://evmrpc-testnet.0g.ai";
// Need to add factory address manually. We use a placeholder for now, user or env will provide.
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as \`0x\${string}\`;

export const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])'
]);

export const TOURNAMENT_ABI = parseAbi([
  'function config() external view returns (address owner, address tee, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime, string name, string category, uint256 id, string liveUri)',
  'function state() external view returns (uint8)'
]);
```

- [ ] **Step 2: Commit**
```bash
git add frontend/package.json frontend/package-lock.json frontend/lib/web3.ts
git commit -m "feat: setup viem client and contract ABIs"
```

### Task 3: Fetch Data for Tournaments Page

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/hooks/use-tournaments.ts`

- [ ] **Step 1: Create a hook to fetch all tournaments and their configurations**
```typescript
// frontend/hooks/use-tournaments.ts
import { useState, useEffect } from 'react';
import { publicClient, FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from '@/lib/web3';
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
}

export function useTournaments() {
  const [tournaments, setTournaments] = useState<ContractTournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTournaments() {
      try {
        if (FACTORY_ADDRESS === "0x0000000000000000000000000000000000000000") {
            console.warn("Factory address not configured.");
            setLoading(false);
            return;
        }
        const addresses = await publicClient.readContract({
          address: FACTORY_ADDRESS,
          abi: TOURNAMENT_FACTORY_ABI,
          functionName: 'getTournaments'
        }) as \`0x\${string}\`[];

        const results = await Promise.all(addresses.map(async (address) => {
          const config = await publicClient.readContract({
            address,
            abi: TOURNAMENT_ABI,
            functionName: 'config'
          }) as any[];
          
          const state = await publicClient.readContract({
            address,
            abi: TOURNAMENT_ABI,
            functionName: 'state'
          }) as number;

          // state: 0 = Registration, 1 = Active, 2 = Finished
          const statusMap: Record<number, TournamentStatus> = {
            0: 'REGISTRATION',
            1: 'LIVE',
            2: 'FINISHED'
          };

          return {
            id: config[8].toString(),
            title: config[6],
            status: statusMap[state] || 'FINISHED',
            mainIcon: state === 1 ? 'zap' : state === 0 ? 'clock' : 'lock',
            category: config[7],
            mode: 'Solo', // Can be derived or mocked
            slots: \`0/\${config[3].toString()}\`,
            timeLabel: state === 0 ? 'STARTS AT' : 'ENDED',
            timeValue: new Date(Number(config[5]) * 1000).toLocaleString(),
            reward: \`\${(Number(config[2]) * Number(config[3]) / 1e18).toFixed(2)} 0G\`, // Example math
            rewardValue: Number(config[2]),
            closesAt: Number(config[5]) * 1000,
            createdAt: Date.now(),
            address: address,
            liveUri: config[9],
            rawState: state
          } as ContractTournament;
        }));

        setTournaments(results);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchTournaments();
  }, []);

  return { tournaments, loading };
}
```

- [ ] **Step 2: Update `frontend/app/page.tsx` to use dynamic tournaments**
```tsx
// frontend/app/page.tsx
"use client";

import { Header } from "@/components/header";
import { TournamentList } from "@/components/tournament-list";
import { useTournaments } from "@/hooks/use-tournaments";
import { rawMarkets } from "@/lib/mock-data";

export default function Page() {
  const { tournaments, loading } = useTournaments();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
             <div className="text-center py-20 animate-pulse text-slate-500">LOADING TOURNAMENTS...</div>
          ) : (
             <TournamentList initialMarkets={tournaments.length > 0 ? tournaments : rawMarkets} />
          )}
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Run to make sure no errors**
(Check manually by loading the page if running `npm run dev`)

- [ ] **Step 4: Commit**
```bash
git add frontend/hooks/use-tournaments.ts frontend/app/page.tsx
git commit -m "feat: fetch dynamic tournaments from smart contract"
```

### Task 4: Live Broadcast Chess Component

**Files:**
- Create: `frontend/components/live-chess-board.tsx`
- Modify: `frontend/components/tournament-detail.tsx`

- [ ] **Step 1: Create `live-chess-board.tsx`**
```tsx
// frontend/components/live-chess-board.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";

interface LiveChessBoardProps {
  liveUri: string;
  isActive: boolean;
}

export function LiveChessBoard({ liveUri, isActive }: LiveChessBoardProps) {
  const [game, setGame] = useState(new Chess());
  const [connectionStatus, setConnectionStatus] = useState<string>("WAITING...");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!isActive || !liveUri) {
      setConnectionStatus(isActive ? "NO LIVE URI PROVIDED" : "TOURNAMENT NOT ACTIVE");
      return;
    }

    setConnectionStatus("CONNECTING...");
    const ws = new WebSocket(liveUri);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnectionStatus("CONNECTED");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.move) {
          const gameCopy = new Chess(game.fen());
          gameCopy.move(data.move);
          setGame(gameCopy);
        }
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onclose = () => {
      setConnectionStatus("DISCONNECTED");
    };

    return () => {
      ws.close();
    };
  }, [liveUri, isActive]);

  return (
    <div className="flex flex-col items-center w-full">
      <div className="mb-4 text-[10px] font-bold tracking-widest uppercase text-slate-500">
        CONNECTION: <span className={connectionStatus === 'CONNECTED' ? 'text-[#00E5FF]' : 'text-amber-500'}>{connectionStatus}</span>
      </div>
      <div className="w-full max-w-[400px]">
        <Chessboard position={game.fen()} arePiecesDraggable={false} customDarkSquareStyle={{ backgroundColor: "#1e293b" }} customLightSquareStyle={{ backgroundColor: "#f8fafc" }} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update `frontend/components/tournament-detail.tsx`**
```tsx
// Find "Live Broadcast Card" in frontend/components/tournament-detail.tsx and modify it:

// Add imports at top:
// import { LiveChessBoard } from "@/components/live-chess-board";

          {/* Live Broadcast Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              LIVE BROADCAST
            </h3>
            
            {/* Inject the live chess board here */}
            {/* Using arbitrary props for mock data, in a real scenario this data comes from useTournaments() hook for a specific ID */}
            {data.status === "ACTIVE" || data.status === "LIVE" ? (
               <LiveChessBoard liveUri={(data as any).liveUri || "ws://localhost:8080"} isActive={true} />
            ) : (
               <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">
                 BROADCAST OFFLINE
               </div>
            )}
          </div>
```
*(Note: We should ensure that when navigating to the detail page, we pass the real `liveUri`. For this task, we will add support for it in the mock-data or ensure the prop is accessible).*

- [ ] **Step 3: Modify `frontend/app/tournaments/[id]/page.tsx` to handle live dynamic data**
To make it real, we'll alter the detailed page to read from our viem custom hook.

```tsx
// frontend/app/tournaments/[id]/page.tsx
"use client";

import { Header } from "@/components/header";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { use } from "react";
import { TournamentDetail } from "@/components/tournament-detail";
import { mockTournamentDetail } from "@/lib/mock-data";
import { useTournaments } from "@/hooks/use-tournaments";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournaments, loading } = useTournaments();

  const activeTournament = tournaments.find(t => t.id === id);

  // Fallback to mock data structure for properties we don't fetch yet, while injecting real status and liveUri
  const data = activeTournament ? {
    ...mockTournamentDetail,
    title: activeTournament.title,
    status: activeTournament.status === 'LIVE' ? 'ACTIVE' : activeTournament.status,
    liveUri: activeTournament.liveUri
  } : mockTournamentDetail;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] transition-colors">
                <ChevronLeft size={16} strokeWidth={2} />
              </Link>
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-slate-500">
                <Link href="/" className="hover:text-[#131b2e] dark:hover:text-white transition-colors">HUB</Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-[#131b2e] dark:text-white">DETAIL</span>
              </div>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse text-slate-500">LOADING DETAILS...</div>
            ) : (
                <TournamentDetail data={data} />
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Ensure TournamentDetail types accept `liveUri`**
Update `frontend/lib/mock-data.ts` to include `liveUri?: string` in `TournamentData` interface.
```typescript
export interface TournamentData {
  title: string;
  description: string;
  status: string;
  liveUri?: string;
  // ... other properties
```

- [ ] **Step 5: Check typescript compilation**
```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 6: Commit**
```bash
git add frontend/components/live-chess-board.tsx frontend/components/tournament-detail.tsx frontend/app/tournaments/\[id\]/page.tsx frontend/lib/mock-data.ts
git commit -m "feat: add live chess broadcast using websockets"
```
