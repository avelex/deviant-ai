"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  
  const [mounted, setMounted] = React.useState(false);

  // useEffect only runs on the client, so now we can safely show the UI
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 flex items-center justify-center text-slate-500 rounded-none w-9 h-9">
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="hover:bg-[#00E5FF]/10 transition-all duration-200 p-2 flex items-center justify-center text-slate-500 hover:text-[#00E5FF] dark:text-slate-400 dark:hover:text-[#00E5FF] rounded-none w-9 h-9 relative"
      title="Toggle theme"
    >
      <Sun size={20} strokeWidth={1.5} className="absolute rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon size={20} strokeWidth={1.5} className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
