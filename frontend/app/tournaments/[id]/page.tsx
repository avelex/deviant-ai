import { Header } from "@/components/header";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { use } from "react";
import { TournamentDetail } from "@/components/tournament-detail";
import { mockTournamentDetail } from "@/lib/mock-data";

export default function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  // In a real app, you would fetch data using the 'id'
  // const data = await fetchTournament(id);
  const data = mockTournamentDetail;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          
          {/* Header Area */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Link href="/" className="inline-flex items-center text-slate-400 hover:text-[#00E5FF] dark:hover:text-[#00E5FF] transition-colors">
                <ChevronLeft size={16} strokeWidth={2} />
              </Link>
              <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest uppercase text-slate-500">
                <Link href="/" className="hover:text-[#131b2e] dark:hover:text-white transition-colors">HUB</Link>
                <span className="text-slate-300 dark:text-slate-700">/</span>
                <span className="text-[#131b2e] dark:text-white">DETAIL</span>
              </div>
            </div>

            <TournamentDetail data={data} />
          </div>
          
        </div>
      </main>
    </div>
  );
}
