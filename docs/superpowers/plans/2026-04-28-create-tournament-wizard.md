# Create Tournament Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Create Tournament" button and a wizard-style modal to the home page to allow users to deploy new tournaments.

**Architecture:** 
- Add `TournamentActions` component for the "Create Tournament" trigger.
- Add `CreateTournamentModal` component for the data collection wizard.
- Update `web3.ts` to include the `createTournament` ABI.
- Integrate both into the main `Page` component.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide React, Viem, Wagmi, RainbowKit.

---

### Task 1: Update Web3 Library

**Files:**
- Modify: `frontend/lib/web3.ts`

- [ ] **Step 1: Add `createTournament` to `TOURNAMENT_FACTORY_ABI`**

```typescript
export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])',
  'function createTournament(string name, string category, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime) external returns (address)'
]);
```

- [ ] **Step 2: Commit**

```bash
git add frontend/lib/web3.ts
git commit -m "chore: add createTournament to factory ABI"
```

---

### Task 2: Create Tournament Actions Component

**Files:**
- Create: `frontend/components/tournament-actions.tsx`

- [ ] **Step 1: Implement `TournamentActions` component**

```tsx
"use client";

import { Plus } from "lucide-react";

interface TournamentActionsProps {
  onCreateClick: () => void;
}

export function TournamentActions({ onCreateClick }: TournamentActionsProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 className="font-display text-2xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight">
          Active Tournaments
        </h2>
        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mt-1">
          Select a battle to join or watch
        </p>
      </div>
      
      <button
        onClick={onCreateClick}
        className="flex items-center justify-center gap-2 bg-[#00E5FF] text-black px-6 py-3 text-[11px] font-bold tracking-widest uppercase hover:bg-[#00E5FF]/90 transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
      >
        <Plus size={16} />
        Create Tournament
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/tournament-actions.tsx
git commit -m "feat: add TournamentActions component"
```

---

### Task 3: Create Tournament Wizard Modal

**Files:**
- Create: `frontend/components/create-tournament-modal.tsx`

- [ ] **Step 1: Implement `CreateTournamentModal` component**

```tsx
"use client";

import { useState } from "react";
import { X, Trophy, Activity, Calendar, DollarSign, Users, Percent } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI } from "@/lib/web3";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["Chess", "Trading", "Gaming", "General"];

export function CreateTournamentModal({ isOpen, onClose }: CreateTournamentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Chess",
    maxSlots: "10",
    slotPrice: "0.1",
    feeRate: "2.5",
    startTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16), // Default to 1 hour from now
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: TOURNAMENT_FACTORY_ABI,
        functionName: "createTournament",
        args: [
          formData.name,
          formData.category,
          parseEther(formData.slotPrice),
          BigInt(formData.maxSlots),
          BigInt(Math.floor(parseFloat(formData.feeRate) * 100)), // Convert to basis points
          BigInt(Math.floor(new Date(formData.startTime).getTime() / 1000)),
        ],
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  if (isSuccess) {
    // Optionally show success state or just close
    onClose();
  }

  const isFormValid = formData.name.trim().length > 0 && 
                      parseFloat(formData.maxSlots) > 0 && 
                      parseFloat(formData.slotPrice) >= 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00E5FF]/10 flex items-center justify-center">
              <Trophy size={16} className="text-[#00E5FF]" />
            </div>
            <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
              Initialize Tournament
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-8">
          {/* SEC 1: Identity */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Tournament Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. ALPHA CHAMPIONSHIP"
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Category</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none appearance-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SEC 2: Economics */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Economics & Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Users size={10} /> Max Slots
                </label>
                <input 
                  type="number" 
                  value={formData.maxSlots}
                  onChange={(e) => setFormData({...formData, maxSlots: e.target.value})}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <DollarSign size={10} /> Slot Price (0G)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.slotPrice}
                  onChange={(e) => setFormData({...formData, slotPrice: e.target.value})}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Percent size={10} /> Fee Rate (%)
                </label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.feeRate}
                  onChange={(e) => setFormData({...formData, feeRate: e.target.value})}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEC 3: Schedule */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Schedule</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                <Calendar size={10} /> Start Time (Local)
              </label>
              <input 
                type="datetime-local" 
                value={formData.startTime}
                onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              Error: {error.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/20">
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isPending || isConfirming}
            className={`flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-widest uppercase transition-all
              ${(!isFormValid || isPending || isConfirming) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]'}
            `}
          >
            {isPending ? 'REQUESTING...' : isConfirming ? 'CONFIRMING...' : 'CREATE TOURNAMENT'}
            {!isPending && !isConfirming && <Activity size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/components/create-tournament-modal.tsx
git commit -m "feat: add CreateTournamentModal component with contract integration"
```

---

### Task 4: Integrate into Main Page

**Files:**
- Modify: `frontend/app/page.tsx`

- [ ] **Step 1: Add Modal state and components to `Page`**

```tsx
"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { TournamentList } from "@/components/tournament-list";
import { TournamentActions } from "@/components/tournament-actions";
import { CreateTournamentModal } from "@/components/create-tournament-modal";
import { useTournaments } from "@/hooks/use-tournaments";

export default function Page() {
  const { tournaments, loading } = useTournaments();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          <TournamentActions onCreateClick={() => setIsCreateModalOpen(true)} />
          
          {loading ? (
            <div className="text-center py-20 animate-pulse text-slate-500">LOADING TOURNAMENTS...</div>
          ) : (
            <TournamentList initialMarkets={tournaments} />
          )}
        </div>
      </main>

      <CreateTournamentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/page.tsx
git commit -m "feat: integrate tournament actions and create modal into home page"
```
