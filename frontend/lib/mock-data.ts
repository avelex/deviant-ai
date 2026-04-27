import { MarketStatus } from "@/components/market-card";
import { AgentStatus } from "@/components/agent-card";

export interface TournamentData {
  title: string;
  description: string;
  status: string;
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

export const rawMarkets = [
  {
    id: "quantum-arbitrage",
    title: "QUANTUM ARBITRAGE OP",
    status: "LIVE" as MarketStatus,
    mainIcon: "zap" as const,
    category: "Trading",
    mode: "Team",
    slots: "4/5",
    timeLabel: "CLOSES IN",
    timeValue: "02:14:59",
    reward: "125,000 USDC",
    rewardValue: 125000,
    closesAt: Date.now() + 2 * 3600000 + 14 * 60000 + 59 * 1000, // 2 hours
    createdAt: Date.now() - 86400000 * 2, // 2 days ago
  },
  {
    id: "predictive-routing",
    title: "PREDICTIVE ROUTING V4",
    status: "OPEN" as MarketStatus,
    mainIcon: "clock" as const,
    category: "Logic Puzzles",
    mode: "Solo",
    slots: "12/50",
    timeLabel: "STARTS",
    timeValue: "OCT 24, 14:00 UTC",
    reward: "40,000 USDC",
    rewardValue: 40000,
    closesAt: Date.now() + 86400000 * 10, // 10 days from now
    createdAt: Date.now() - 86400000 * 1, // 1 day ago
  },
  {
    id: "hft-liquidity-swarm",
    title: "HFT LIQUIDITY SWARM",
    status: "LOCKED" as MarketStatus,
    mainIcon: "lock" as const,
    category: "Trading",
    mode: "Team",
    slots: "20/20",
    timeLabel: "ENDED AT",
    timeValue: "SEP 12, 10:00 UTC",
    reward: "10,000 USDC",
    rewardValue: 10000,
    closesAt: Number.MAX_SAFE_INTEGER, // locked out (sorted last for closing time)
    createdAt: Date.now() - 86400000 * 5, // 5 days ago
  },
  {
    id: "sentiment-analysis",
    title: "SENTIMENT ANALYSIS SWARM",
    status: "OPEN" as MarketStatus,
    mainIcon: "clock" as const,
    category: "Games",
    mode: "Solo",
    slots: "2/100",
    timeLabel: "STARTS",
    timeValue: "NOV 01, 00:00 UTC",
    reward: "75,000 USDC",
    rewardValue: 75000,
    closesAt: Date.now() + 86400000 * 15, // 15 days from now
    createdAt: Date.now() - 86400000 * 0.5, // 12 hours ago
  }
];

export const mockAgents = [
  {
    id: "agt-88x9",
    name: "NEXUS ARBITRAGE v2",
    status: "ACTIVE" as AgentStatus,
    type: "DEFI TRADING",
    model: "CLAUDE-3.5-SONNET",
    performance: "+12.4% / 7D",
    uptime: "142H 12M",
  },
  {
    id: "agt-12b4",
    name: "SENTIMENT SCRAPER",
    status: "ACTIVE" as AgentStatus,
    type: "DATA AGGREGATION",
    model: "GPT-4o-MINI",
    performance: "1.2M REQ / 24H",
    uptime: "21D 04H",
  },
  {
    id: "agt-99f1",
    name: "LIQUIDITY SNIPER",
    status: "IDLE" as AgentStatus,
    type: "HFT",
    model: "CUSTOM RUST / ONNX",
    performance: "WAITING FOR TARGET",
    uptime: "00H 45M",
  },
  {
    id: "agt-44c2",
    name: "PREDICTIVE LOGIC ZERO",
    status: "OFFLINE" as AgentStatus,
    type: "GENERAL REASONING",
    model: "GEMINI 3.1 PRO",
    performance: "YIELD: N/A",
    uptime: "OFFLINE",
  },
];

export const mockTournamentDetail: TournamentData = {
  title: "ALPHA-STRIKE PROTOCOL",
  description: "High-frequency arbitrage across decentralized liquidity pools.",
  status: "REGISTRATION OPEN",
  parameters: {
    category: "Trading",
    type: "Solo",
    duration: "72H",
    reward: "$10,000",
  },
  roster: {
    filledDisplay: "4/5 SLOTS FILL",
    players: [
      { name: "Nexus_Prime", address: "0x4F...9A21", avatarPattern: "repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 2px, transparent 2px, transparent 6px)" },
      { name: "Quant_Mantis", address: "0x1A...3B4C", avatarPattern: "repeating-linear-gradient(-45deg, #e2e8f0 0, #e2e8f0 2px, transparent 2px, transparent 6px)" },
      { name: "Null_Pointer", address: "0x9C...88F0", avatarPattern: "radial-gradient(circle, #e2e8f0 2px, transparent 2px) 0 0 / 6px 6px" },
      { name: "Arb_Sweeper_V2", address: "0x77...11D9", avatarPattern: "linear-gradient(90deg, #e2e8f0 50%, transparent 50%) 0 0 / 6px 100%" },
    ]
  },
  rules: [
    "Maximum leverage capped at 10x per simulated sub-account.",
    "Agents must maintain a minimum ping of < 50ms to the core matching engine.",
    "Drawdown exceeding 15% results in immediate automated liquidation and disqualification."
  ]
};
