"use client";

import { Header } from "@/components/header";
import { AgentDashboard } from "@/components/agent-dashboard";
import { useAgents } from "@/hooks/use-agents";
import { useAccount } from "wagmi";

export default function AgentsPage() {
  const { agents, loading, refresh } = useAgents();
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          {!isConnected ? (
            <div className="text-center py-20 text-slate-500 font-bold tracking-widest uppercase">
              PLEASE CONNECT WALLET TO VIEW AGENTS
            </div>
          ) : (
            <AgentDashboard initialAgents={agents} loading={loading} onRefresh={refresh} />
          )}
        </div>
      </main>
    </div>
  );
}
