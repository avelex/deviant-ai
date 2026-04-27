"use client";

import { useState } from "react";
import { X, Cpu, Activity } from "lucide-react";

interface DeployAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeployAgentModal({ isOpen, onClose }: DeployAgentModalProps) {
  const [agentName, setAgentName] = useState("");
  const [scriptCode, setScriptCode] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);

  if (!isOpen) return null;

  const isFormValid = agentName.trim().length > 0 && scriptCode.trim().length > 0;

  const handleDeploy = () => {
    setIsDeploying(true);
    // Simulate deployment delay
    setTimeout(() => {
      setIsDeploying(false);
      setAgentName("");
      setScriptCode("");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#131b2e]/80 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-[#00E5FF]/20 shadow-[0_0_40px_rgba(0,229,255,0.1)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#00E5FF]/10 flex items-center justify-center">
              <Cpu size={16} className="text-[#00E5FF]" />
            </div>
            <div>
              <h2 className="font-display text-xl font-light text-[#131b2e] dark:text-white uppercase tracking-tight leading-none">
                Agent Deployment
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 flex flex-col gap-8">
          {/* SEC 1: METADATA */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">
              Metadata
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                Agent Designation (Name)
              </label>
              <input 
                type="text" 
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="e.g. ALPHA-STRIKER-01"
                className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 text-sm font-medium text-[#131b2e] dark:text-white focus:border-[#00E5FF] dark:focus:border-[#00E5FF] outline-none transition-colors"
                autoComplete="off"
              />
            </div>
          </div>

          {/* SEC 2: SCRIPT */}
          <div className="flex flex-col gap-4">
            <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">
              Script
            </h3>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                TypeScript Execution Logic
              </label>
              <textarea 
                value={scriptCode}
                onChange={(e) => setScriptCode(e.target.value)}
                placeholder="// Enter agent logic here..."
                className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-700 dark:text-slate-300 focus:border-[#00E5FF] dark:focus:border-[#00E5FF] outline-none transition-colors min-h-[200px] resize-y"
                spellCheck={false}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/20">
          <button
            onClick={handleDeploy}
            disabled={!isFormValid || isDeploying}
            className={`flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-widest uppercase transition-all
              ${(!isFormValid || isDeploying) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]'}
            `}
          >
            {isDeploying ? 'INITIALIZING...' : 'DEPLOY AGENT'}
            {!isDeploying && <Activity size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
