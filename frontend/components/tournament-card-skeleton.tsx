"use client";

export function TournamentCardSkeleton() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row items-stretch md:items-center gap-6 animate-pulse">
      {/* Icon Skeleton */}
      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 shrink-0" />

      {/* Title & Info Skeleton */}
      <div className="flex-1 flex flex-col gap-3">
        <div className="h-6 bg-slate-100 dark:bg-slate-800 w-3/4" />
        <div className="flex gap-4">
          <div className="h-3 bg-slate-100 dark:bg-slate-800 w-20" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 w-20" />
          <div className="h-3 bg-slate-100 dark:bg-slate-800 w-20" />
        </div>
      </div>

      {/* Right Section Skeleton */}
      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-8 min-w-[140px]">
        <div className="flex flex-col items-start md:items-end gap-1">
          <div className="h-2 bg-slate-100 dark:bg-slate-800 w-16" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 w-24" />
        </div>
        <div className="h-10 bg-slate-100 dark:bg-slate-800 w-full md:w-32" />
      </div>
    </div>
  );
}
