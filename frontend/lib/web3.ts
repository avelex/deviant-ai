import { createPublicClient, http, parseAbi } from 'viem';

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://evmrpc-testnet.0g.ai";
// Need to add factory address manually. We use a placeholder for now, user or env will provide.
export const FACTORY_ADDRESS = (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const publicClient = createPublicClient({
  transport: http(RPC_URL),
});

export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])'
]);

export const TOURNAMENT_ABI = parseAbi([
  'function config() external view returns (address owner, address tee, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startTime, uint256 id, string name, string category, string liveUri)',
  'function state() external view returns (uint8)'
]);
