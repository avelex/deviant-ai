"use client";

import { useState, useEffect } from "react";
import { X, Cpu, Upload, CheckCircle2, Save } from "lucide-react";
import { Indexer, MemData } from "@0gfoundation/0g-ts-sdk";
import { ethers } from "ethers";
import { useAccount, useWalletClient, useWriteContract, usePublicClient } from "wagmi";
import { DEVIANT_ID_ADDRESS, DEVIANT_NFT_ABI, INDEXER_URL, RPC_URL } from "@/lib/web3";

interface EditAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string | null;
  onSuccess?: () => void;
}

export function EditAgentModal({ isOpen, onClose, agentId, onSuccess }: EditAgentModalProps) {
  const [scriptCode, setScriptCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rootHash, setRootHash] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Load existing script when modal opens
  useEffect(() => {
    async function loadAgentData() {
      if (!isOpen || !agentId || !publicClient) return;
      
      setIsLoading(true);
      setScriptCode("");
      setRootHash(null);
      
      try {
        const datas = await publicClient.readContract({
          address: DEVIANT_ID_ADDRESS,
          abi: DEVIANT_NFT_ABI,
          functionName: 'intelligentDatasOf',
          args: [BigInt(agentId)],
        }) as { dataDescription: string, dataHash: string }[];
        
        const scriptData = datas.find(d => d.dataDescription === "script");
        
        if (scriptData && scriptData.dataHash) {
          const hash = scriptData.dataHash.replace("0x", "");
          
          const indexer = new Indexer(INDEXER_URL);
          const [blob, err] = await indexer.downloadToBlob(hash);
          
          if (err) {
            console.error("Failed to load script content", err);
          } else if (blob) {
            const text = await blob.text();
            setScriptCode(text);
          }
        }
      } catch (error) {
        console.error("Failed to load agent data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadAgentData();
  }, [isOpen, agentId, publicClient]);

  if (!isOpen) return null;

  const isFormValid = scriptCode.trim().length > 0 && !!rootHash;

  const handleUpload = async () => {
    if (!scriptCode || !walletClient) return;

    setIsUploading(true);
    try {
      // Convert walletClient to ethers signer
      const provider = new ethers.BrowserProvider(walletClient);
      const signer = await provider.getSigner();

      const indexer = new Indexer(INDEXER_URL);
      const data = new TextEncoder().encode(scriptCode);
      const memData = new MemData(data);

      console.log("[0G Upload] Calculating Merkle Tree...");
      const [tree, treeErr] = await memData.merkleTree();
      if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

      const hash = tree!.rootHash();
      console.log(`[0G Upload] Root Hash: ${hash}`);

      console.log("[0G Upload] Uploading to 0G Storage...");
      const [tx, uploadErr] = await indexer.upload(memData, RPC_URL, signer);
      if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

      console.log("\n[0G Upload] SUCCESS!");
      setRootHash(hash);
    } catch (error: any) {
      console.error(`\n[0G Upload] FAILED: ${error.message}`);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid || !address || !rootHash || !agentId) return;

    setIsSaving(true);
    try {
      const newDatas = [
        {
          dataDescription: "script",
          dataHash: rootHash.startsWith("0x") ? rootHash as `0x${string}` : `0x${rootHash}` as `0x${string}`,
        }
      ];

      await writeContractAsync({
        address: DEVIANT_ID_ADDRESS,
        abi: DEVIANT_NFT_ABI,
        functionName: 'update',
        args: [BigInt(agentId), newDatas],
      });

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
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
                Edit Agent Script
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20 text-slate-500 font-bold tracking-widest uppercase">
              LOADING SCRIPT FROM 0G STORAGE...
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-bold tracking-widest uppercase text-[#131b2e] dark:text-white">
                  Script
                </h3>
                {scriptCode && !rootHash && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-1.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-[10px] font-bold tracking-widest uppercase hover:bg-[#00E5FF]/20 transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'UPLOADING...' : 'UPLOAD TO 0G'}
                    {!isUploading && <Upload size={12} />}
                  </button>
                )}
                {rootHash && (
                  <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold tracking-widest uppercase">
                    <CheckCircle2 size={12} />
                    UPLOADED
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                  TypeScript Execution Logic
                </label>
                <textarea
                  value={scriptCode}
                  onChange={(e) => {
                    setScriptCode(e.target.value);
                    setRootHash(null); // Reset hash if code changes
                  }}
                  placeholder="// Enter agent logic here..."
                  className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 font-mono text-xs text-slate-700 dark:text-slate-300 focus:border-[#00E5FF] dark:focus:border-[#00E5FF] outline-none transition-colors min-h-[300px] resize-y"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Storage Info */}
          {rootHash && (
            <div className="flex flex-col gap-4 p-4 bg-emerald-500/5 border border-emerald-500/20 animate-in fade-in slide-in-from-top-2">
              <h3 className="text-[11px] font-bold tracking-widest uppercase text-emerald-600 dark:text-emerald-400">
                0G Storage Confirmation
              </h3>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Root Hash</span>
                <code className="text-[10px] break-all text-emerald-700 dark:text-emerald-300 font-mono">
                  {rootHash}
                </code>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-900/20">
          <button
            onClick={handleSave}
            disabled={!isFormValid || isSaving || isLoading}
            className={`flex items-center gap-2 px-8 py-3 text-[11px] font-bold tracking-widest uppercase transition-all
              ${(!isFormValid || isSaving || isLoading) ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-[#00E5FF] text-black hover:bg-[#00E5FF]/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.4)]'}
            `}
          >
            {isSaving ? 'SAVING...' : 'SAVE CHANGES'}
            {!isSaving && <Save size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
