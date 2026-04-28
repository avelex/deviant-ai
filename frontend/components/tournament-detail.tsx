"use client";

import { Check, FileText, X, Settings } from "lucide-react";
import { useState } from "react";
import { TournamentData } from "@/lib/mock-data";
import { LiveChessBoard } from "@/components/live-chess-board";
import { useAccount, useWriteContract } from "wagmi";
import { AdminPanel } from "./admin-panel";
import { TOURNAMENT_ABI } from "@/lib/web3";
import { formatEther } from "viem";

interface TournamentDetailProps {
  data: TournamentData;
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
        className="w-full border border-[#00E5FF] bg-[#00E5FF]/10 hover:bg-[#00E5FF] hover:text-black text-[#00E5FF] p-4 flex items-center justify-center mt-2 transition-all font-bold tracking-widest uppercase text-[11px] shadow-[0_0_15px_rgba(0,229,255,0.15)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)]"
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
        className="bg-transparent border-b border-[#00E5FF]/50 text-[#00E5FF] text-xs py-2 px-1 outline-none placeholder:text-[#00E5FF]/30 font-bold tracking-widest"
      />
      <div className="flex gap-2">
        <button 
          onClick={handleJoin}
          disabled={isPending}
          className="flex-1 bg-[#00E5FF] text-black p-2 text-[10px] font-bold tracking-widest uppercase hover:bg-white transition-colors disabled:opacity-50"
        >
          {isPending ? "JOINING..." : "CONFIRM JOIN"}
        </button>
        <button 
          onClick={() => setIsJoining(false)}
          className="px-3 border border-slate-700 text-slate-500 hover:text-white text-[10px] font-bold tracking-widest uppercase"
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}

function StartTournamentButton({ tournamentAddress, disabled }: { tournamentAddress: string, disabled?: boolean }) {
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
      className="px-6 py-3 bg-[#00E5FF] text-black hover:bg-white text-[11px] font-bold tracking-widest uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale-[0.5]"
    >
      {isPending ? "STARTING..." : "START TOURNAMENT"}
    </button>
  );
}
export function TournamentDetail({ data }: TournamentDetailProps) {
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const { address: connectedAddress } = useAccount();
  const isOwner = connectedAddress && data.owner && connectedAddress.toLowerCase() === data.owner.toLowerCase();

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
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-[#00E5FF] dark:hover:border-[#00E5FF] bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold tracking-widest uppercase transition-colors"
          >
            <Settings size={14} className="text-slate-500" />
            <span className="text-[#131b2e] dark:text-white">CONFIGURATION</span>
          </button>

          <button
            onClick={() => setIsRulesOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 hover:border-[#00E5FF] dark:hover:border-[#00E5FF] bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold tracking-widest uppercase transition-colors"
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
        <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">

          {/* Live Broadcast Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800/50 pb-4">
              LIVE BROADCAST
            </h3>
            {data.status === "ACTIVE" || data.status === "LIVE" ? (
               <LiveChessBoard liveUri={(data as any).liveUri || "ws://localhost:8080"} isActive={true} />
            ) : (
               <div className="flex items-center justify-center h-64 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 text-xs font-bold tracking-widest uppercase">
                 BROADCAST OFFLINE
               </div>
            )}
          </div>

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
                const odds = (1.5 + idx * 0.4).toFixed(2);
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

                    <button className="min-w-[80px] sm:min-w-[100px] border-l border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center bg-white dark:bg-slate-950 hover:bg-[#00E5FF] hover:text-black hover:border-transparent text-[#131b2e] dark:text-white transition-all cursor-pointer">
                      <span className="text-lg font-bold leading-none mb-1">{odds}</span>
                      <span className="text-[9px] font-bold tracking-widest uppercase opacity-70 leading-none">ODDS</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6 lg:gap-8">

          {/* Competitor Roster Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 md:p-8 pt-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4 mb-6 mt-1">
              <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                COMPETITOR ROSTER
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
                  <div className="w-[18px] h-[18px] rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-white dark:text-slate-900 shrink-0">
                    <Check size={10} strokeWidth={4} />
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

                return (
                  <div className="border border-dashed border-slate-300 dark:border-slate-700 p-4 flex items-center justify-center mt-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                      AWAITING AGENT
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {isOwner && data.address && (
            <div className="mt-6 lg:mt-8">
              <AdminPanel tournamentAddress={data.address} />
            </div>
          )}

        </div>
      </div>

      {/* Config Modal */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsConfigOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
                Configuration
              </h2>
              <button onClick={() => setIsConfigOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border border-slate-100 dark:border-slate-800/50 p-4 shrink-0 shadow-sm shadow-slate-100/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">Category</div>
                  <div className="text-lg text-[#131b2e] dark:text-white font-medium">{data.parameters.category}</div>
                </div>
                <div className="border border-slate-100 dark:border-slate-800/50 p-4 shrink-0 shadow-sm shadow-slate-100/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">Type</div>
                  <div className="text-lg text-[#131b2e] dark:text-white font-medium">{data.parameters.type}</div>
                </div>
                <div className="border border-slate-100 dark:border-slate-800/50 p-4 shrink-0 shadow-sm shadow-slate-100/50 dark:shadow-none bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">Duration</div>
                  <div className="text-lg text-[#131b2e] dark:text-white font-medium">{data.parameters.duration}</div>
                </div>
                <div className="border-y border-r border-slate-100 dark:border-slate-800/50 border-l-[3px] border-l-[#00E5FF] p-4 bg-white dark:bg-slate-900 shadow-sm shadow-slate-100/50 dark:shadow-none">
                  <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-2">Reward</div>
                  <div className="text-lg text-[#131b2e] dark:text-white font-bold">{data.parameters.reward}</div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-[11px] font-bold tracking-widest uppercase text-slate-500 mb-4">
                  Technical Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Owner Address</div>
                    <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">{data.owner}</div>
                  </div>
                  <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">TEE Address</div>
                    <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">
                      {data.teeAddress && data.teeAddress !== "0x0000000000000000000000000000000000000000" ? data.teeAddress : "NOT SET"}
                    </div>
                  </div>
                  <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Slot Price</div>
                    <div className="text-[13px] text-[#131b2e] dark:text-white font-bold">
                      {data.slotPrice ? `${formatEther(data.slotPrice)} 0G` : "FREE"}
                    </div>
                  </div>
                  <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Max Capacity</div>
                    <div className="text-[13px] text-[#131b2e] dark:text-white font-bold">{data.maxSlots} AGENTS</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
              {(() => {
                const currentSlots = data.roster?.players?.length || 0;
                const maxSlots = Number(data.maxSlots || "0");
                const isFull = currentSlots > 0 && currentSlots === maxSlots;
                const isRegistrationOpen = data.rawState === 0;
                const isTime = data.startTime ? Date.now() >= data.startTime : true;
                const canStart = isRegistrationOpen && isFull && isTime && isOwner;

                return (
                  <StartTournamentButton 
                    tournamentAddress={data.address!} 
                    disabled={!canStart} 
                  />
                );
              })()}
              <button onClick={() => setIsConfigOpen(false)} className="px-6 py-3 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[11px] font-bold tracking-widest uppercase transition-all">
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={() => setIsRulesOpen(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
                Execution Rules
              </h2>
              <button onClick={() => setIsRulesOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <ul className="flex flex-col gap-4">
                {data.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3.5 text-sm md:text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                    <div className="relative shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full bg-[#00E5FF] flex items-center justify-center">
                        <Check size={12} strokeWidth={3} color="black" />
                      </div>
                    </div>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end">
              <button onClick={() => setIsRulesOpen(false)} className="px-6 py-3 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[11px] font-bold tracking-widest uppercase transition-all">
                UNDERSTOOD
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
