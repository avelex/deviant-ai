"use client";

import { useState, useEffect } from "react";
import { X, Trophy, Activity, Calendar, DollarSign, Users, Percent } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import { FACTORY_ADDRESS, TOURNAMENT_FACTORY_ABI } from "@/lib/web3";

interface CreateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES = ["chess", "trading", "gaming"];

export function CreateTournamentModal({ isOpen, onClose }: CreateTournamentModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "chess",
    maxSlots: "2",
    slotPrice: "0",
    feeRate: "0",
    startedAt: Math.floor(Date.now() + 5 * 60 * 1000) / 1000
  });

  const { writeContract, data: hash, isPending, error } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isSuccess) {
      onClose();
    }
  }, [isSuccess, onClose]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    try {
      writeContract({
        address: FACTORY_ADDRESS,
        abi: TOURNAMENT_FACTORY_ABI,
        functionName: "createTournament",
        args: [
          formData.name,
          formData.category,
          parseEther(formData.slotPrice),
          BigInt(Math.floor(Number(formData.maxSlots))),
          Number(BigInt(Math.floor(parseFloat(formData.feeRate) * 100))), // Convert to basis points
          BigInt(Math.floor(formData.startedAt)),
          BigInt(0)
        ],
      });
    } catch (err) {
      console.error("Submission failed:", err);
    }
  };

  const isFormValid = formData.name.trim().length > 0 &&
    parseFloat(formData.maxSlots) > 0 &&
    parseFloat(formData.slotPrice) >= 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00E5FF]/10 flex items-center justify-center">
              <Trophy size={16} className="text-[#00E5FF]" />
            </div>
            <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
              Initialize Tournament
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-8">
          {/* SEC 1: Identity */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Identity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Tournament Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. ALPHA CHAMPIONSHIP"
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none appearance-none"
                >
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* SEC 2: Economics */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Economics & Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Users size={10} /> Max Slots
                </label>
                <input
                  type="number"
                  value={formData.maxSlots}
                  onChange={(e) => setFormData({ ...formData, maxSlots: e.target.value })}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <DollarSign size={10} /> Slot Price (0G)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.slotPrice}
                  onChange={(e) => setFormData({ ...formData, slotPrice: e.target.value })}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  <Percent size={10} /> Fee Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.feeRate}
                  onChange={(e) => setFormData({ ...formData, feeRate: e.target.value })}
                  className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
                />
              </div>
            </div>
          </div>

          {/* SEC 3: Schedule */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">Schedule</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                <Calendar size={10} /> Start Time (Local)
              </label>
              <input
                type="datetime-local"
                value={new Date(formData.startedAt * 1000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)}
                onChange={(e) => {
                  const newTime = new Date(e.target.value).getTime();
                  if (!isNaN(newTime)) {
                    setFormData({ ...formData, startedAt: Math.floor(newTime / 1000) });
                  }
                }}
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium">
              Error: {error.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/20">
          <button
            onClick={handleCreate}
            disabled={!isFormValid || isPending || isConfirming}
            className={`flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-widest uppercase transition-all
              ${(!isFormValid || isPending || isConfirming) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]'}
            `}
          >
            {isPending ? 'REQUESTING...' : isConfirming ? 'CONFIRMING...' : 'CREATE TOURNAMENT'}
            {!isPending && !isConfirming && <Activity size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
