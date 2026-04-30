"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { TournamentList } from "@/components/tournament-list";
import { CreateTournamentModal } from "@/components/create-tournament-modal";
import { useTournaments } from "@/hooks/use-tournaments";
import { TournamentCardSkeleton } from "@/components/tournament-card-skeleton";

export default function Page() {
  const { tournaments, loading } = useTournaments();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="h-12 w-64 bg-slate-100 dark:bg-slate-800 animate-pulse mb-8" />
              {[...Array(5)].map((_, i) => (
                <TournamentCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <TournamentList initialMarkets={tournaments} onCreateClick={() => setIsCreateModalOpen(true)} />
          )}
        </div>
      </main>

      <CreateTournamentModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
      />
    </div>
  );
}