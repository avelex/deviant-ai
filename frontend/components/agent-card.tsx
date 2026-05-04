import { Cpu, Power, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export type AgentStatus = 'ACTIVE' | 'IDLE' | 'OFFLINE';

export interface AgentCardProps {
  id: string;
  name: string;
  status: AgentStatus;
  type: string;
  model: string;
  performance: string;
  uptime: string;
  onClick?: () => void;
}

export function AgentCard({ id, name, status, type, model, performance, uptime, onClick }: AgentCardProps) {
  const isActive = status === 'ACTIVE';
  const isIdle = status === 'IDLE';

  return (
    <article 
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 xl:p-8 flex flex-col transition-all duration-300 relative overflow-hidden rounded-none hover:border-[#00E5FF] dark:hover:border-[#00E5FF] cursor-pointer"
    >
      
      {/* Background glow on hover */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#00E5FF]/0 via-[#00E5FF]/5 to-[#00E5FF]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
      )}

      {/* Title block */}
      <div className="flex items-start gap-4 relative z-10">
        <div className={cn(
          "w-12 h-12 shrink-0 flex items-center justify-center border transition-colors",
          isActive ? 'bg-[#131b2e] dark:bg-slate-800 border-transparent text-[#00E5FF]' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
        )}>
          {isActive ? <Activity size={24} strokeWidth={1.5} /> : isIdle ? <Cpu size={24} strokeWidth={1.5} /> : <Power size={24} strokeWidth={1.5} />}
        </div>
        
        <div className="flex flex-col">
          <h2 className="font-display text-xl lg:text-2xl font-light tracking-tight text-[#131b2e] dark:text-white uppercase m-0 leading-none mb-1 group-hover:text-[#00E5FF] transition-colors">
            {name}
          </h2>
          <div className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            ID: {id}
          </div>
        </div>
      </div>

    </article>
  );
}
