import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const RPC_URL = "https://evmrpc-testnet.0g.ai";
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const zeroGGalileo = defineChain({
  id: 16602,
  name: '0G Galileo Testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: '0G Scan', url: 'https://chainscan-testnet.0g.ai' },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'Deviant AI',
  projectId: 'YOUR_PROJECT_ID', // Replace with a real one or placeholder for now
  chains: [zeroGGalileo],
  ssr: true,
});

export const publicClient = createPublicClient({
  chain: zeroGGalileo,
  transport: http(RPC_URL),
});

export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])',
  'function createTournament(string name, string category, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime) external returns (address)',
  'function setTournamentTee(address _tournament, address _tee) external'
]);

export const TOURNAMENT_ABI = parseAbi([
  'function config() external view returns (address owner, address tee, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime, uint256 id, string name, string category, string liveUri)',
  'function state() external view returns (uint8)',
  'function getAgentKeys() external view returns (uint256[])',
  'function setLiveUri(string calldata _liveUri) external',
  'function joinTournament(uint256 agentId) external payable',
  'function startTournament() external',
  'function resolveTournament(uint256 _winnerAgentId, bytes32 _resultHash, bytes calldata _signature) external'
]);
