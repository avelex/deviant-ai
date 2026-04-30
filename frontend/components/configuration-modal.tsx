"use client";

import { X } from "lucide-react";
import { formatEther } from "viem";
import { TournamentData } from "@/lib/mock-data";
import { StartTournamentButton } from "./start-tournament-button";

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: TournamentData;
  isOwner: boolean;
}

export function ConfigurationModal({ isOpen, onClose, data, isOwner }: ConfigurationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
            Configuration
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
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
              <div className="border border-slate-100 dark:border-slate-800/50 p-4 bg-slate-50/30 dark:bg-slate-900/30 md:col-span-2">
                <div className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase mb-1">Live URI</div>
                <div className="text-[13px] text-[#131b2e] dark:text-white font-mono break-all">{data.liveUri || "NOT SET"}</div>
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
            const canStart = isRegistrationOpen && isFull && isOwner;

            return (
              <StartTournamentButton
                tournamentAddress={data.address!}
                disabled={!canStart}
              />
            );
          })()}
          <button onClick={onClose} className="px-6 py-3 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[11px] font-bold tracking-widest uppercase transition-all">
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
