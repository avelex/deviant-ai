import { TournamentStatus } from "@/components/tournament-card";
import { AgentStatus } from "@/components/agent-card";

export interface TournamentData {
  title: string;
  description: string;
  status: string;
  liveUri?: string;
  owner?: string;
  address?: string;
  rawState?: number;
  slotPrice?: bigint;
  parameters: {
    category: string;
    type: string;
    duration: string;
    reward: string;
  };
  roster: {
    filledDisplay: string;
    players: {
      name: string;
      address: string;
      avatarPattern: string;
    }[];
  };
  rules: string[];
}