"use client";

import { X, Check } from "lucide-react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: string[];
}

export function RulesModal({ isOpen, onClose, rules }: RulesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
            Execution Rules
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          <ul className="flex flex-col gap-4">
            {rules.map((rule, idx) => (
              <li key={idx} className="flex items-start gap-3.5 text-sm md:text-[15px] font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="relative shrink-0 mt-1">
                  <div className="w-5 h-5 rounded-full bg-[#00E5FF] flex items-center justify-center">
                    <Check size={12} strokeWidth={3} color="black" />
                  </div>
                </div>
                {rule}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 flex justify-end">
          <button onClick={onClose} className="px-6 py-3 bg-[#131b2e] dark:bg-slate-800 text-white hover:bg-[#00E5FF] hover:text-black text-[11px] font-bold tracking-widest uppercase transition-all">
            UNDERSTOOD
          </button>
        </div>
      </div>
    </div>
  );
}
