"use client";

import { useState, useRef, useEffect } from "react";
import { TournamentCard, TournamentStatus } from "@/components/tournament-card";
import { Filter, ArrowUpDown, ChevronDown, Plus } from "lucide-react";

interface Tournament {
  id: string;
  title: string;
  status: TournamentStatus;
  mainIcon: 'zap' | 'clock' | 'lock';
  category: string;
  mode: string;
  slots: string;
  timeLabel: string;
  timeValue: string;
  reward: string;
  rewardValue: number;
  closesAt: number;
  createdAt: number;
}

interface TournamentListProps {
  initialMarkets: Tournament[];
  onCreateClick?: () => void;
}

export function TournamentList({ initialMarkets, onCreateClick }: TournamentListProps) {
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'REGISTRATION' | 'FINISHED'>('ALL');

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const processedMarkets = initialMarkets
    .filter(m => filter === 'ALL' || m.status === filter);

  return (
    <>
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 md:mb-12 border-b border-slate-200 dark:border-slate-800 pb-4 gap-6 md:gap-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-6">
            <h1 className="font-display text-4xl md:text-[48px] font-light text-[#131b2e] dark:text-white uppercase tracking-tighter leading-none">
              Active Tournaments
            </h1>
            {onCreateClick && (
              <button
                onClick={onCreateClick}
                className="flex items-center justify-center gap-2 bg-[#00E5FF] text-black px-4 py-2 text-[10px] font-bold tracking-widest uppercase hover:bg-[#00E5FF]/90 transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.4)] whitespace-nowrap"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">Create Tournament</span>
                <span className="sm:hidden">Create</span>
              </button>
            )}
          </div>
          <p className="text-slate-500 font-medium">
            Explore AI Tournaments
          </p>
        </div>

        {/* Filter/Sort Utility */}
        <div className="flex gap-4 w-full md:w-auto relative z-20">

          {/* Filter Dropdown */}
          <div className="relative flex-1 md:flex-none" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full h-full flex items-center justify-between md:justify-center gap-2 border border-slate-200 dark:border-slate-800 px-4 py-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-[12px] font-semibold tracking-widest uppercase transition-colors rounded-none hover:border-[#00E5FF] dark:hover:border-[#00E5FF]"
            >
              <div className="flex items-center gap-2">
                <Filter size={16} strokeWidth={2} />
                FILTER: {filter}
              </div>
              <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFilterOpen && (
              <div className="absolute top-full right-0 mt-1 w-full min-w-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden backdrop-blur-md">
                {(['ALL', 'LIVE', 'REGISTRATION', 'FINISHED'] as const).map(option => (
                  <button
                    key={option}
                    onClick={() => { setFilter(option); setIsFilterOpen(false); }}
                    className={`w-full text-left px-4 py-3 text-[12px] font-semibold tracking-widest uppercase transition-colors
                      ${filter === option ? 'bg-[#00E5FF]/10 text-[#131b2e] dark:text-white border-l-2 border-[#00E5FF]' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#131b2e] dark:hover:text-white border-l-2 border-transparent'}
                    `}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Precision Data List View */}
      <div className="flex flex-col gap-4 relative z-10 w-full transition-all">
        {processedMarkets.length > 0 ? (
          processedMarkets.map((market, i) => (
            <div key={market.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${Math.min(i * 100, 300)}ms` }}>
              <TournamentCard
                id={market.id}
                title={market.title}
                status={market.status}
                mainIcon={market.mainIcon}
                category={market.category}
                mode={market.mode}
                slots={market.slots}
                timeLabel={market.timeLabel}
                timeValue={market.timeValue}
                reward={market.reward}
              />
            </div>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-500 w-full animate-in fade-in">
            <span className="font-semibold tracking-widest text-sm uppercase">NO MARKETS FOUND MATCHING CRITERIA</span>
          </div>
        )}
      </div>
    </>
  );
}
