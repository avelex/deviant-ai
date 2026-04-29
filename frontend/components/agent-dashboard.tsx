"use client";

import { useState } from "react";
import { AgentCard, AgentStatus } from "@/components/agent-card";
import { Plus, RefreshCw } from "lucide-react";
import { DeployAgentModal } from "@/components/deploy-agent-modal";

interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  type: string;
  model: string;
  performance: string;
  uptime: string;
}

interface AgentDashboardProps {
  initialAgents: Agent[];
  loading?: boolean;
  onRefresh?: () => void;
}

export function AgentDashboard({ initialAgents, loading, onRefresh }: AgentDashboardProps) {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);

  console.log("initialAgents", initialAgents);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 border-b border-slate-200 dark:border-slate-800 pb-4 gap-6 md:gap-0">
        <div>
          <h1 className="font-display text-4xl md:text-[48px] font-light text-[#131b2e] dark:text-white uppercase tracking-tighter leading-none mb-2">
            My Agents
          </h1>
          <p className="text-slate-500 font-medium">
            Manage, monitor, and deploy autonomous execution entities.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto mt-4 md:mt-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-[#00E5FF] px-4 py-3 text-[10px] font-bold tracking-widest uppercase transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-[#00E5FF]" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="flex items-center justify-center gap-2 border border-[#00E5FF] bg-[#00E5FF]/10 hover:bg-[#00E5FF] hover:text-black text-[#00E5FF] px-6 py-3 text-[12px] font-bold tracking-widest uppercase transition-all rounded-none hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]"
          >
            <Plus size={16} strokeWidth={2.5} />
            DEPLOY NEW AGENT
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      {loading ? (
        <div className="text-center py-20 animate-pulse text-slate-500 text-sm font-bold tracking-widest uppercase">
          FETCHING DEVIANTS...
        </div>
      ) : initialAgents.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 text-sm font-bold tracking-widest uppercase">
          NO DEVIANTS FOUND FOR CONNECTED WALLET
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10 w-full transition-all">
          {initialAgents.map((agent, i) => (
            <div key={agent.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full" style={{ animationDelay: `${Math.min(i * 100, 300)}ms` }}>
              <AgentCard {...agent} />
            </div>
          ))}
        </div>
      )}

      <DeployAgentModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />
    </>
  );
}
