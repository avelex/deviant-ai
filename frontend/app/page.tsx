"use client";

import { Header } from "@/components/header";
import { TournamentList } from "@/components/tournament-list";
import { useTournaments } from "@/hooks/use-tournaments";

export default function Page() {
  const { tournaments, loading } = useTournaments();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="text-center py-20 animate-pulse text-slate-500">LOADING TOURNAMENTS...</div>
          ) : (
            <TournamentList initialMarkets={tournaments} />
          )}
        </div>
      </main>
    </div>
  );
}