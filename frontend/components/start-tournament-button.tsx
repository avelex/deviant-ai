"use client";

import { useWriteContract } from "wagmi";
import { TOURNAMENT_ABI } from "@/lib/web3";

interface StartTournamentButtonProps {
  tournamentAddress: string;
  disabled?: boolean;
}

export function StartTournamentButton({ tournamentAddress, disabled }: StartTournamentButtonProps) {
  const { writeContract, isPending } = useWriteContract();

  const handleStart = () => {
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "startTournament",
    });
  };

  return (
    <button
      onClick={handleStart}
      disabled={isPending || disabled}
      className="px-6 py-3 bg-[#00E5FF] text-black hover:bg-white text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      {isPending ? "STARTING..." : "START TOURNAMENT"}
    </button>
  );
}
