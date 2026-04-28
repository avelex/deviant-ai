"use client";

import { Header } from "@/components/header";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { use } from "react";
import { TournamentDetail } from "@/components/tournament-detail";
import { useTournaments } from "@/hooks/use-tournaments";
import { TournamentData } from "@/lib/mock-data";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { tournaments, loading } = useTournaments();

  const activeTournament = tournaments.find(t => t.id === id);

  // Fallback to mock data structure for properties we don't fetch yet, while injecting real status and liveUri
  const data = activeTournament ? {
    title: activeTournament.title,
    owner: activeTournament.owner,
    address: activeTournament.address,
    status: activeTournament.status === 'LIVE' ? 'ACTIVE' : activeTournament.status,
    liveUri: activeTournament.liveUri,
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
              <TournamentDetail data={data as TournamentData} />
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
