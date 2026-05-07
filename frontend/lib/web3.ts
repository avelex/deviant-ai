import { createPublicClient, http, parseAbi, defineChain } from 'viem';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { BrowserProvider, JsonRpcSigner } from 'ethers';
import type { Account, Chain, Client, Transport } from 'viem';
import { zeroGMainnet as defaultZeroGMainnet } from 'wagmi/chains';

export const zeroGMainnet = defineChain({
  ...defaultZeroGMainnet,
  contracts: {
    ...defaultZeroGMainnet.contracts,
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 6546802,
    },
  },
});

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://evmrpc.0g.ai";
export const INDEXER_URL = process.env.NEXT_PUBLIC_INDEXER_URL || "https://indexer-storage-turbo.0g.ai";
export const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS! as `0x${string}`;
export const DEVIANT_ID_ADDRESS = process.env.NEXT_PUBLIC_DEVIANT_ID_ADDRESS! as `0x${string}`;

export const config = getDefaultConfig({
  appName: 'Deviant AI',
  projectId: 'YOUR_PROJECT_ID', // Replace with a real one or placeholder for now
  chains: [zeroGMainnet],
  ssr: true,
});

export const publicClient = createPublicClient({
  chain: zeroGMainnet,
  transport: http(RPC_URL),
});

export const TOURNAMENT_FACTORY_ABI = parseAbi([
  'function getTournaments() external view returns (address[])',
  'function createTournament(string name, string category, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 startedAt, uint256 finishedAt) external returns (address)',
  'function setTournamentTee(address _tournament, address _tee) external'
]);

export const TOURNAMENT_ABI = parseAbi([
  'function config() external view returns (address owner, address tee, uint256 slotPrice, uint256 maxSlots, uint16 feeRate, uint256 createdAt, uint256 startedAt, uint256 finishedAt, uint256 id, string name, string category, string liveUri)',
  'function state() external view returns (uint8)',
  'function getAgentKeys() external view returns (uint256[])',
  'function setLiveUri(string calldata _liveUri) external',
  'function joinTournament(uint256 agentId) external payable',
  'function startTournament() external',
  'function resolveTournament(uint256 _winnerAgentId, bytes32 _resultHash, bytes calldata _signature, bool _noWinner) external',
  'function placeBet(uint256 _agentId) external payable',
  'function claimRewards() external',
  'function getOdds(uint256 _agentId) external view returns (uint256)',
  'function totalBetsPool() external view returns (uint256)',
  'function totalBetsOnAgent(uint256 _agentId) external view returns (uint256)',
  'function userBetsOnAgent(address _user, uint256 _agentId) external view returns (uint256)',
  'function hasClaimed(address _user) external view returns (bool)',
  'function winnerAgentId() external view returns (uint256)',
  'function noWinner() external view returns (bool)'
]);

export const DEVIANT_NFT_ABI = parseAbi([
  'function totalSupply() external view returns (uint256)',
  'function ownerOf(uint256 tokenId) external view returns (address)',
  'struct IntelligentData { string dataDescription; bytes32 dataHash; }',
  'function intelligentDatasOf(uint256 tokenId) external view returns (IntelligentData[] memory)',
  'function mint(IntelligentData[] calldata iDatas, address to) external payable returns (uint256)',
  'function getMintFee() external view returns (uint256)',
  'function update(uint256 tokenId, IntelligentData[] calldata newDatas) external'
]);

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

