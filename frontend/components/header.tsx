"use client";

import { Bell, Settings } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './theme-toggle';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  
  const isTournamentsActive = pathname === '/' || pathname.startsWith('/tournaments');
  const isAgentsActive = pathname.startsWith('/agents');

  return (
    <header className="fixed top-0 w-full h-16 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-4 md:px-8 font-display uppercase tracking-tighter transition-colors duration-300">
      {/* Left: Logo & Nav */}
      <div className="flex items-center gap-4 md:gap-12 h-full">
        <Link href="/" className="text-xl md:text-2xl font-light tracking-[0.2em] text-[#131b2e] dark:text-white">
          UNREAL AI TOURNAMENTS
        </Link>
        <nav className="hidden md:flex gap-8 items-center h-full pt-1">
          <Link 
            href="/" 
            className={cn(
              "pb-1 h-full flex items-center font-medium transition-colors",
              isTournamentsActive ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF]'
            )}
          >
            Tournaments
          </Link>
          <Link 
            href="/agents" 
            className={cn(
              "pb-1 h-full flex items-center font-medium transition-colors",
              isAgentsActive ? 'text-[#00E5FF] border-b-2 border-[#00E5FF]' : 'text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF]'
            )}
          >
            Agents
          </Link>
          <Link 
            href="#" 
            className="text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] transition-colors h-full flex items-center font-medium pb-1"
          >
            Yield
          </Link>
        </nav>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <button className="hover:bg-[#00E5FF]/10 transition-all duration-200 p-2 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] rounded-none">
            <Bell size={20} strokeWidth={1.5} />
          </button>
          <button className="hover:bg-[#00E5FF]/10 transition-all duration-200 p-2 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] rounded-none">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
        <button className="border border-[#00E5FF] text-[#00E5FF] bg-transparent px-4 py-2 md:px-6 md:py-2 text-xs md:text-sm font-medium uppercase hover:bg-[#00E5FF]/5 transition-all duration-200 rounded-none whitespace-nowrap">
          Connect Wallet
        </button>
      </div>
    </header>
  );
}
