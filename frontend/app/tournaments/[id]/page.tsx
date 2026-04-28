"use client";

import { Header } from "@/components/header";
import Link from "next/link";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { use } from "react";
import { TournamentDetail } from "@/components/tournament-detail";
import { useTournaments } from "@/hooks/use-tournaments";
import { TournamentData } from "@/lib/mock-data";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournaments, loading, refresh } = useTournaments();

  const activeTournament = tournaments.find(t => t.id === id);

  // Fallback to mock data structure for properties we don't fetch yet, while injecting real status and liveUri
  const data = activeTournament ? {
    title: activeTournament.title,
    description: "An AI agent tournament.",
    owner: activeTournament.owner,
    address: activeTournament.address,
    rawState: activeTournament.rawState,
    slotPrice: activeTournament.slotPrice,
    maxSlots: activeTournament.slots.split('/')[1],
    startedAt: activeTournament.startedAt,
    teeAddress: activeTournament.teeAddress,
    status: activeTournament.status,
    liveUri: activeTournament.liveUri,
    parameters: {
      category: activeTournament.category || "AI Chess",
      type: activeTournament.mode || "Solo",
      duration: activeTournament.timeValue || "TBD",
      reward: activeTournament.reward || "0G",
    },
    rules: [
      "AI agents must respond within 5 seconds.",
      "Any invalid moves result in an automatic loss.",
      "The tournament uses a round-robin format."
    ],
    roster: {
      filledDisplay: `${activeTournament.agentKeys.length}/${activeTournament.slots.split('/')[1]} SLOTS FILL`,
      players: activeTournament.agentKeys.map((agentId, i) => ({
        name: `Agent ${agentId}`,
        address: `ID: ${agentId}`,
        avatarPattern: i % 2 === 0 ? "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 2px, transparent 2px, transparent 6px)" : "repeating-linear-gradient(-45deg, #e2e8f0 0, #e2e8f0 2px, transparent 2px, transparent 6px)"
      }))
    }
  } : {};

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">

          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] transition-colors">
                  <ChevronLeft size={16} strokeWidth={2} />
                </Link>
                <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-slate-500">
                  <Link href="/" className="hover:text-[#131b2e] dark:hover:text-white transition-colors">HUB</Link>
                  <span className="text-slate-300 dark:text-slate-700">/</span>
                  <span className="text-[#131b2e] dark:text-white">DETAIL</span>
                </div>
              </div>

              <button
                onClick={() => refresh()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-800 hover:border-[#00E5FF] text-[10px] font-bold tracking-widest uppercase text-slate-500 hover:text-[#00E5FF] transition-all disabled:opacity-50"
              >
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                REFRESH
              </button>
            </div>

            {loading && !activeTournament ? (
              <div className="text-center py-20 animate-pulse text-slate-500">LOADING DETAILS...</div>
            ) : (
              <TournamentDetail data={data as TournamentData} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
