import { Zap, Clock, Lock, User, Users, LayoutGrid as CategoryIcon, Timer, Calendar, Flag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type TournamentStatus = 'LIVE' | 'REGISTRATION' | 'FINISHED';

interface TournamentCardProps {
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
}

export function TournamentCard({ id, title, status, mainIcon, category, mode, slots, timeLabel, timeValue, reward }: TournamentCardProps) {
  const isLive = status === 'LIVE';
  const isOpen = status === 'REGISTRATION';
  const isLocked = status === 'FINISHED';

  const MainIconComponent = mainIcon === 'zap' ? Zap : mainIcon === 'clock' ? Clock : Lock;
  const TimeIcon = isLive ? Timer : isOpen ? Calendar : Flag;

  return (
    <Link
      href={`/tournaments/${id}`}
      className={cn(
        "group block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 transition-all duration-300 relative overflow-hidden backdrop-blur-md rounded-none",
        (isLive || isOpen) && "hover:border-[#00E5FF] dark:hover:border-[#00E5FF]",
        isLocked && "opacity-75 grayscale-[50%] hover:grayscale-0"
      )}
    >
      {/* Subtle hover glow effect for live/open items */}
      {(isLive || isOpen) && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#00E5FF]/0 via-[#00E5FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-0"></div>
      )}

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 h-full relative z-10">

        <div className="flex flex-col md:flex-row md:items-center gap-8 w-full lg:w-auto mb-2 lg:mb-0">
          {/* Main Solid Status Block */}
          <div className={cn(
            "flex flex-col items-center justify-center w-16 h-16 shrink-0 rounded-none transition-colors duration-300",
            isLive && "bg-[#131b2e] dark:bg-slate-800 text-white",
            isOpen && "border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400",
            isLocked && "border border-slate-200 dark:border-slate-800 bg-transparent text-slate-500 dark:text-slate-500"
          )}>
            <MainIconComponent
              size={28}
              className={cn(
                isLive ? 'text-[#00E5FF] fill-[#00E5FF]' : isLocked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
              )}
              strokeWidth={isLive ? 1 : 2}
            />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <span className={cn(
                "px-2 py-0.5 text-[10px] uppercase tracking-widest font-bold self-start md:self-auto rounded-none",
                isLive && "bg-[#00E5FF] text-black",
                isOpen && "bg-indigo-50 dark:bg-cyan-950/20 border border-slate-200 dark:border-slate-800 text-[#131b2e] dark:text-slate-300",
                isLocked && "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                {status}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-light tracking-tight text-[#131b2e] dark:text-white uppercase m-0 leading-none">
                {title}
              </h2>
            </div>

            {/* Metadata Row */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 text-[11px] md:text-[12px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CategoryIcon size={14} className="text-slate-400 dark:text-slate-500" />
                <span>CATEGORY: <span className="text-[#131b2e] dark:text-slate-200">{category}</span></span>
              </div>

              <div className="hidden md:block w-px h-3 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-2">
                <Users size={14} className="text-slate-400 dark:text-slate-500" />
                <span>MODE: <span className="text-[#131b2e] dark:text-slate-200">{mode}</span></span>
              </div>

              <div className="hidden md:block w-px h-3 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-2">
                <User size={14} className="text-slate-400 dark:text-slate-500" />
                <span>SLOTS: <span className="text-[#131b2e] dark:text-slate-200">{slots}</span></span>
              </div>

              <div className="hidden md:block w-px h-3 bg-slate-200 dark:bg-slate-700"></div>

              <div className="flex items-center gap-2 text-[#131b2e] dark:text-slate-200">
                <TimeIcon size={14} className={isLive ? 'text-[#00E5FF]' : 'text-slate-400 dark:text-slate-500'} />
                <span className={cn(isLive ? 'text-[#00E5FF]' : 'text-[#131b2e] dark:text-slate-200')}>
                  <span className="text-slate-500 dark:text-slate-400 mr-2">{timeLabel}:</span>
                  {timeValue}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reward */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end w-full lg:w-auto border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-100 dark:border-slate-800/50 justify-between lg:justify-start">
          <div className="flex flex-col lg:items-end">
            <div className="text-[12px] font-semibold tracking-widest uppercase text-slate-500 dark:text-slate-400 mb-1 lg:mb-2">
              REWARD POOL
            </div>
            <div className={cn(
              "font-display text-3xl md:text-4xl font-light leading-none",
              (isLive || isOpen) ? "text-[#00E5FF]" : "text-slate-400 dark:text-slate-500"
            )}>
              {reward}
            </div>
          </div>
        </div>

      </div>
    </Link>
  );
}
