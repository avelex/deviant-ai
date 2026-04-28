"use client";

import { useState } from "react";
import { Header } from "@/components/header";
import { TournamentList } from "@/components/tournament-list";
import { TournamentActions } from "@/components/tournament-actions";
import { CreateTournamentModal } from "@/components/create-tournament-modal";
import { useTournaments } from "@/hooks/use-tournaments";

export default function Page() {
  const { tournaments, loading } = useTournaments();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          <TournamentActions onCreateClick={() => setIsCreateModalOpen(true)} />
          
          {loading ? (
            <div className="text-center py-20 animate-pulse text-slate-500">LOADING TOURNAMENTS...</div>
          ) : (
            <TournamentList initialMarkets={tournaments} />
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