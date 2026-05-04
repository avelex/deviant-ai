"use client";

import { Check, FileText, X, Settings, Wallet } from "lucide-react";
import { useState } from "react";
import { TournamentData } from "@/lib/mock-data";
import { LiveChessBoard } from "@/components/live-chess-board";
import { TournamentResult } from "@/components/tournament-result";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { TOURNAMENT_ABI } from "@/lib/web3";
import { formatEther, parseEther } from "viem";
import { ConfigurationModal } from "./configuration-modal";
import { RulesModal } from "./rules-modal";
import { StartTournamentButton } from "./start-tournament-button";

interface TournamentDetailProps {
  data: TournamentData;
}

function BetButton({ tournamentAddress, agentId, startedAt, rawState }: { tournamentAddress: string, agentId: string, startedAt: number, rawState: number }) {
  const [isBetting, setIsBetting] = useState(false);
  const [betAmount, setBetAmount] = useState("");
  const { writeContract, isPending } = useWriteContract();

  const { data: oddsResult } = useReadContract({
    address: tournamentAddress as `0x${string}`,
    abi: TOURNAMENT_ABI,
    functionName: "getOdds",
    args: [BigInt(agentId)],
    query: {
      refetchInterval: 5000
    }
  });

  const odds = oddsResult ? (Number(oddsResult as bigint) / 1e18).toFixed(2) : "0.00";
  console.log("Raw state:", rawState);
  const canBet = rawState === 0;

  const handleBet = () => {
    if (!betAmount) return;
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "placeBet",
      args: [BigInt(agentId)],
      value: parseEther(betAmount),
    });
  };

  if (!canBet) {
    return (
      <div className="min-w-[80px] sm:min-w-[100px] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400">
        <span className="text-lg font-bold leading-none mb-1">{odds}</span>
        <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 leading-none">ODDS</span>
      </div>
    );
  }

  if (!isBetting) {
    return (
      <button
        onClick={() => setIsBetting(true)}
        className="min-w-[80px] sm:min-w-[100px] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-white dark:bg-slate-950 hover:bg-[#00E5FF] hover:text-black hover:border-transparent text-[#131b2e] dark:text-white transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF] focus-visible:ring-inset"
      >
        <span className="text-lg font-bold leading-none mb-1">{odds}</span>
        <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 leading-none">BET</span>
      </button>
    );
  }

  return (
    <div className="min-w-[150px] border-l border-slate-200 dark:border-slate-800 flex flex-col p-2 bg-white dark:bg-slate-950">
      <input
        type="number"
        step="0.01"
        placeholder="Amount (0G)"
        value={betAmount}
        onChange={(e) => setBetAmount(e.target.value)}
        className="bg-transparent border-b border-[#00E5FF]/50 text-[#131b2e] dark:text-[#00E5FF] text-[10px] py-1 px-1 outline-none focus-visible:border-[#00E5FF] placeholder:text-slate-400 font-bold"
      />
      <div className="flex gap-1 mt-2">
        <button
          onClick={handleBet}
          disabled={isPending}
          className="flex-1 bg-[#00E5FF] text-black p-1 text-[8px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
        >
          {isPending ? "..." : "CONFIRM"}
        </button>
        <button
          onClick={() => setIsBetting(false)}
          className="px-2 border border-slate-700 text-slate-500 hover:text-white text-[8px] font-bold tracking-widest uppercase"
        >
          X
        </button>
      </div>
    </div>
  );
}

function JoinSection({ tournamentAddress, slotPrice }: { tournamentAddress: string, slotPrice: bigint }) {
  const [isJoining, setIsJoining] = useState(false);
  const [agentId, setAgentId] = useState("");
  const { writeContract, isPending } = useWriteContract();

  const handleJoin = () => {
    if (!agentId) return;
    writeContract({
      address: tournamentAddress as `0x${string}`,
      abi: TOURNAMENT_ABI,
      functionName: "joinTournament",
      args: [BigInt(agentId)],
      value: slotPrice,
    });
  };

  if (!isJoining) {
    return (
      <button
        onClick={() => setIsJoining(true)}
        className="w-full border border-[#00E5FF] bg-[#00E5FF]/10 hover:bg-[#00E5FF] hover:text-black text-[#00E5FF] p-4 flex items-center justify-center mt-2 transition-all font-bold tracking-widest uppercase text-[11px] shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
      >
        JOIN TOURNAMENT
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2 p-4 border border-[#00E5FF]/30 bg-slate-900/50">
      <input
        type="number"
        placeholder="ENTER AGENT NFT ID"
        value={agentId}
        onChange={(e) => setAgentId(e.target.value)}
        className="bg-transparent border-b border-[#00E5FF]/50 text-[#00E5FF] text-xs py-2 px-1 outline-none focus-visible:border-[#00E5FF] focus-visible:ring-1 focus-visible:ring-[#00E5FF]/30 placeholder:text-[#00E5FF]/30 font-bold tracking-widest"
      />
      <div className="flex gap-2">
        <button
          onClick={handleJoin}
          disabled={isPending}
          className="flex-1 bg-[#00E5FF] text-black p-2 text-[10px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          {isPending ? "JOINING..." : "CONFIRM JOIN"}
        </button>
        <button
          onClick={() => setIsJoining(false)}
          className="px-3 border border-slate-700 text-slate-500 hover:text-white text-[10px] font-bold tracking-widest uppercase focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

export function TournamentDetail({ data }: TournamentDetailProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { address: connectedAddress } = useAccount();
  const isOwner = !!(connectedAddress && data.owner && connectedAddress.toLowerCase() === data.owner.toLowerCase());

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-200 dark:border-slate-800 pb-8 gap-6 md:gap-0">
        <div>
          <h1 className="font-display text-4xl md:text-[44px] font-light text-[#131b2e] dark:text-white uppercase tracking-tighter leading-none mb-3">
            {data.title}
          </h1>
          <p className="text-slate-500 text-sm md:text-base font-medium">
            {data.description}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-[#00E5FF] dark:hover:border-[#00E5FF] bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
          >
            <Settings size={14} className="text-slate-500" />
            <span className="text-[#131b2e] dark:text-white">CONFIGURATION</span>
          </button>

          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-[#00E5FF] dark:hover:border-[#00E5FF] bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold tracking-widest uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]"
          >
            <FileText size={14} className="text-slate-500" />
            <span className="text-[#131b2e] dark:text-white">RULES</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[10px] font-bold tracking-widest uppercase">
            <div className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shrink-0"></div>
            <span className="text-[#131b2e] dark:text-white">{data.status}</span>
          </div>
        </div>
      </div>

      {/* 2-Column Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start mt-8">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-3">

          {/* Live Broadcast Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            {data.status === "ACTIVE" || data.status === "LIVE" ? (
              <LiveChessBoard 
                liveUri={(data as any).liveUri || "ws://localhost:8080"} 
                isActive={true} 
                playerWhiteId={data.roster.players[0]?.id}
                playerBlackId={data.roster.players[1]?.id}
              />
            ) : (
              <>
                <h3 className="font-display text-xl md:text-2xl font-light text-[#131b2e] dark:text-white uppercase mt-1 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                  LIVE BROADCAST
                </h3>
                <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">
                  BROADCAST OFFLINE
                </div>
              </>
            )}
          </div>

          {/* Live Broadcast Result Panel */}
          <TournamentResult
            tournamentAddress={data.address!}
            liveUri={(data as any).liveUri}
            status={data.status}
          />

          {/* Prediction Market / Bets Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <div>
                <div className="font-display text-xl md:text-2xl font-light text-[#131b2e] dark:text-white uppercase mt-1">
                  Who will win the tournament?
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {data.roster.players.map((player, idx) => {
                const isFavorite = idx === 0;
                return (
                  <div key={idx} className="group relative border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-[#00E5FF]/50 transition-colors flex items-stretch">

                    <div className="flex-1 p-3 md:p-4 flex items-center gap-4">
                      <div
                        className="w-10 h-10 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0"
                        style={{ background: player.avatarPattern }}
                      ></div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="text-[13px] font-bold text-[#131b2e] dark:text-white uppercase tracking-wide group-hover:text-[#00E5FF] transition-colors">{player.name}</div>
                          {isFavorite && (
                            <span className="text-[9px] font-bold tracking-widest uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 border border-amber-500/20 leading-none">Favorite</span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest">Win Probability: {45 - idx * 5}%</div>
                      </div>
                    </div>

                    <BetButton
                      tournamentAddress={data.address!}
                      agentId={player.id}
                      startedAt={data.startedAt || 0}
                      rawState={data.rawState || 0}
                    />
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-5 lg:gap-3">

          {/* Competitor Roster Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 pt-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-6 mt-1">
              <h3 className="font-display text-xl md:text-2xl font-light text-[#131b2e] dark:text-white uppercase mt-1">
                DEVIANTS
              </h3>
              <div className="text-[9px] font-bold tracking-wider uppercase bg-slate-100 dark:bg-slate-800 text-[#131b2e] dark:text-slate-300 px-2 py-1">
                {data.roster.filledDisplay}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              {data.roster.players.map((player, idx) => (
                <div key={idx} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 bg-slate-50 dark:bg-slate-800 border-2 border-white dark:border-slate-900 shadow-sm shrink-0"
                      style={{ background: player.avatarPattern }}
                    ></div>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold text-[#131b2e] dark:text-white font-sans uppercase tracking-wide group-hover:text-[#00E5FF] transition-colors">{player.name}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono tracking-wide">{player.address}</span>
                    </div>
                  </div>
                </div>
              ))}

              {(() => {
                const [currentSlots, maxSlots] = data.roster.filledDisplay.split(' ')[0].split('/').map(Number);
                const isNotFull = currentSlots < maxSlots;
                const isRegistrationOpen = data.rawState === 0;

                if (isRegistrationOpen && isNotFull && data.address && data.slotPrice !== undefined) {
                  return <JoinSection tournamentAddress={data.address} slotPrice={data.slotPrice} />;
                }
              })()}
            </div>
          </div>

          {/* Admin panel was here */}
        </div>
      </div>

      <ConfigurationModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        data={data}
        isOwner={isOwner}
      />

      <RulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
        rules={data.rules}
      />
    </>
  );
}
