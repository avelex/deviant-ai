"use client";

import { useState } from "react";
import { useWriteContract } from "wagmi";
import { FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI, TOURNAMENT_ABI } from "@/lib/web3";

interface AdminPanelProps {
  tournamentAddress: string;
}

export function AdminPanel({ tournamentAddress }: AdminPanelProps) {
  const [teeAddress, setTeeAddress] = useState("");
  const [liveUri, setLiveUri] = useState("");
  const { writeContract } = useWriteContract();

  const handleSetTee = () => {
    writeContract({
      address: FACTORY_ADDRESS,
      abi: TOURNAMENT_FACTORY_ABI,
      functionName: "setTournamentTee",
      args: [tournamentAddress as `0x${string}`, teeAddress as `0x${string}`],
    });
  };

  const handleSetLiveUri = () => {
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "setLiveUri",
      args: [liveUri],
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-[#00E5FF]/20 p-6 md:p-8">
      <h3 className="text-[11px] font-bold tracking-widest uppercase text-[#00E5FF] mb-6 border-b border-[#00E5FF]/10 pb-4">
        ADMIN PANEL
      </h3>
      
      <div className="flex flex-col gap-6">
        {/* Set TEE section */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Set TEE Address</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={teeAddress}
              onChange={(e) => setTeeAddress(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-sm font-mono focus:border-[#00E5FF] outline-none transition-colors"
            />
            <button 
              onClick={handleSetTee}
              className="px-4 py-2 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              SET TEE
            </button>
          </div>
        </div>

        {/* Set Live URI section */}
        <div className="flex flex-col gap-3">
          <label className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Set Live URI</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={liveUri}
              onChange={(e) => setLiveUri(e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 text-sm font-mono focus:border-[#00E5FF] outline-none transition-colors"
            />
            <button 
              onClick={handleSetLiveUri}
              className="px-4 py-2 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[10px] font-bold tracking-widest uppercase transition-all"
            >
              SET URI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
