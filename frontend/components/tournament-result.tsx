"use client";

import { useEffect, useState } from "react";
import { useWriteContract, useAccount, useReadContract } from "wagmi";
import { TOURNAMENT_ABI } from "@/lib/web3";

interface TournamentResultProps {
  tournamentAddress: string;
  liveUri?: string;
  status?: string;
}

interface ResultData {
  result: {
    winnerId: string;
    reason: string;
    pgn: string;
    isDraw: boolean;
  };
  resultHash: string;
  tournament: string;
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

function ClaimSection({ tournamentAddress }: { tournamentAddress: string }) {
  const { address } = useAccount();
  const { writeContract, isPending } = useWriteContract();
  
  const { data: hasClaimed, refetch: refetchClaimed } = useReadContract({
    address: tournamentAddress as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "hasClaimed",
    args: address ? [address] : undefined,
    query: {
        enabled: !!address
    }
  });

  const handleClaim = () => {
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "claimRewards",
    }, {
      onSuccess: () => {
        setTimeout(() => refetchClaimed(), 5000);
      }
    });
  };

  if (!address) return null;

  if (hasClaimed) {
    return (
      <div className="text-center py-4 border border-dashed border-[#00E5FF]/30 text-[#00E5FF]/50 text-[10px] font-bold tracking-widest uppercase mt-4">
        REWARDS CLAIMED
      </div>
    );
  }

  return (
    <button
      onClick={handleClaim}
      disabled={isPending}
      className="w-full bg-[#00E5FF] text-black py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50 mt-4 shadow-[0_0_15px_rgba(0,229,255,0.15)]"
    >
      {isPending ? "CLAIMING..." : "CLAIM REWARDS"}
    </button>
  );
}

export function TournamentResult({ tournamentAddress, liveUri, status }: TournamentResultProps) {
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
        BigInt(data.result.winnerId),
        data.attestation.hash as `0x${string}`,
        data.signer.signature as `0x${string}`,
        data.result.isDraw
      ],
    });
  };

  const isResolveDisabled = isPending || !data.signer || !data.attestation || status === 'FINISHED';
  const buttonText = isPending 
    ? "RESOLVING..." 
    : status === 'FINISHED' 
      ? "RESOLVED" 
      : "RESOLVE GAME";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 mt-6 lg:mt-8">
      <h3 className="font-display text-xl md:text-2xl font-light text-[#131b2e] dark:text-white uppercase mt-1 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
        TOURNAMENT RESULT
      </h3>

      {/* Game Section */}
      <div className="mb-8">
        <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-4">Game</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-bold tracking-widest text-[#00E5FF] uppercase mb-1">Winner Agent ID</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.result.winnerId === "0" ? "Draw (0)" : data.result.winnerId}
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-bold tracking-widest text-[#00E5FF] uppercase mb-1">Reason</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.result.reason}
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-bold tracking-widest text-[#00E5FF] uppercase mb-1">Is Draw</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.result.isDraw ? "Yes" : "No"}
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30 md:col-span-2">
            <div className="text-[10px] font-bold tracking-widest text-[#00E5FF] uppercase mb-1">PGN</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all whitespace-pre-wrap max-h-40 overflow-y-auto">
              {data.result.pgn}
            </div>
          </div>
        </div>
      </div>

      {/* TEE Section */}
      <div className="mb-8">
        <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-4">TEE</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30 md:col-span-2">
            <div className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-1">Signer Address</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.signer?.address || "N/A"}
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30 md:col-span-2">
            <div className="text-[10px] font-bold tracking-widest text-amber-500 uppercase mb-1">Signature</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.signer?.signature || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* TEE Attestation Section */}
      <div className="mb-6">
        <h4 className="text-[11px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white mb-4">TEE Attestation</h4>
        <div className="grid grid-cols-1 gap-4">
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-bold tracking-widest text-purple-500 uppercase mb-1">Hash</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
              {data.attestation?.hash || "N/A"}
            </div>
          </div>
          <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="text-[10px] font-bold tracking-widest text-purple-500 uppercase mb-1">Quote</div>
            <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all max-h-48 overflow-y-auto">
              {data.attestation?.quote || "N/A"}
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Resolve Button & Claim Section */}
      <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
        <button
          onClick={handleResolve}
          disabled={isResolveDisabled}
          className="w-full bg-[#00E5FF] text-black py-4 text-[11px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {buttonText}
        </button>

        {status === 'FINISHED' && (
          <ClaimSection tournamentAddress={tournamentAddress} />
        )}
      </div>
    </div>
  );
}
