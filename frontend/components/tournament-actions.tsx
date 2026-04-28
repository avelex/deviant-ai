"use client";

import { Plus } from "lucide-react";

interface TournamentActionsProps {
  onCreateClick: () => void;
}

export function TournamentActions({ onCreateClick }: TournamentActionsProps) {
  return (
    <div className="flex flex-row items-start justify-between gap-4 mb-8">
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
        className="flex items-center justify-center gap-2 bg-[#00E5FF] text-black px-6 py-3 text-[11px] font-bold tracking-widest uppercase hover:bg-[#00E5FF]/90 transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] whitespace-nowrap"
      >
        <Plus size={16} />
        <span className="hidden sm:inline">Create Tournament</span>
        <span className="sm:hidden">Create</span>
      </button>
    </div>
  );
}
