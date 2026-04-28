"use client";

import { useEffect, useState } from "react";
import { useWriteContract } from "wagmi";
import { TOURNAMENT_ABI } from "@/lib/web3";

interface TournamentResultProps {
  tournamentAddress: string;
  liveUri?: string;
}

interface ResultData {
  result: {
    winnerId: string;
    reason: string;
    pgn: string;
  };
  tournament: string;
  winnerAgentId: string;
  signer: {
    address: string;
    signature: string;
  } | null;
  attestation: {
    quote: string;
    hash: string;
    eventLog: string;
    signatureChain: any[];
  } | null;
}

export function TournamentResult({ tournamentAddress, liveUri }: TournamentResultProps) {
  const [data, setData] = useState<ResultData | null>(null);
  const { writeContract, isPending } = useWriteContract();

  useEffect(() => {
    if (!liveUri) return;
    
    // Derive HTTP URL from WebSocket URL
    const resultUrl = liveUri.replace(/^ws(s)?:\/\//, 'http$1://') + '/result';
    
    const fetchResult = async () => {
      try {
        const response = await fetch(resultUrl);
        if (response.ok) {
          const json = await response.json();
          setData(json);
        }
      } catch (error) {
        // Silently ignore fetch errors during polling
      }
    };

    // Initial fetch
    fetchResult();

    // Poll every 1 second
    const interval = setInterval(fetchResult, 1000);
    return () => clearInterval(interval);
  }, [liveUri]);

  // Hide the panel entirely if there is no "result" object yet
  if (!data || !data.result) {
    return null;
  }

  const handleResolve = () => {
    if (!data.signer || !data.attestation) return;
    
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "resolveTournament",
      args: [
        BigInt(data.winnerAgentId || data.result.winnerId), 
        data.attestation.hash as `0x${string}`, 
        data.signer.signature as `0x${string}`
      ],
    });
  };

  const isResolveDisabled = isPending || !data.signer || !data.attestation;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 mt-6 lg:mt-8">
      <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
        LIVE BROADCAST RESULT
      </h3>
      
      {/* Game Section */}
      <div className="mb-6">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-2">Game</h4>
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 font-mono text-xs text-slate-600 dark:text-slate-400 break-all space-y-3">
          <div><span className="text-[#00E5FF] font-bold">Winner Agent ID:</span> {data.result.winnerId === "0" ? "Draw (0)" : data.result.winnerId}</div>
          <div><span className="text-[#00E5FF] font-bold">Reason:</span> {data.result.reason}</div>
          <div className="whitespace-pre-wrap"><span className="text-[#00E5FF] font-bold">PGN:</span>{"\n"}{data.result.pgn}</div>
        </div>
      </div>

      {/* TEE Section */}
      <div className="mb-6">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-2">TEE</h4>
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 font-mono text-xs text-slate-600 dark:text-slate-400 break-all space-y-3">
          <div><span className="text-amber-500 font-bold">Signer Address:</span> {data.signer?.address || "N/A"}</div>
          <div><span className="text-amber-500 font-bold">Signature:</span> {data.signer?.signature || "N/A"}</div>
        </div>
      </div>

      {/* TEE Attestation Section */}
      <div className="mb-6">
        <h4 className="text-[10px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-2">TEE Attestation</h4>
        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-4 font-mono text-xs text-slate-600 dark:text-slate-400 break-all space-y-3 max-h-48 overflow-y-auto">
          <div><span className="text-purple-500 font-bold">Hash:</span> {data.attestation?.hash || "N/A"}</div>
          <div><span className="text-purple-500 font-bold">Quote:</span> {data.attestation?.quote || "N/A"}</div>
        </div>
      </div>

      {/* Footer: Resolve Button */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
         <button
           onClick={handleResolve}
           disabled={isResolveDisabled}
           className="w-full bg-[#00E5FF] text-black py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
         >
           {isPending ? "RESOLVING..." : "RESOLVE GAME"}
         </button>
      </div>
    </div>
  );
}
