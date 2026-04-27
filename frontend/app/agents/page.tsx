import { Header } from "@/components/header";
import { AgentDashboard } from "@/components/agent-dashboard";
import { mockAgents } from "@/lib/mock-data";

export default function AgentsPage() {
  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <Header />
      
      <main className="flex-1 pt-24 pb-12 px-4 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto">
          <AgentDashboard initialAgents={mockAgents} />
        </div>
      </main>
    </div>
  );
}
