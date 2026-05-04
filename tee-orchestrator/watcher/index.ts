import { createPublicClient, http, parseAbiItem, parseAbi, PublicClient } from 'viem';
import { defineChain } from 'viem';
import 'dotenv/config';
import { createClient } from "@phala/cloud";

const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";
const FACTORY_ADDRESS = "0x8a8802E765602BD93aB9aFa3deB3fACA46D9350f" as `0x${string}`;
const AGENT_ID_ADDRESS = "0x06E824145Be317FbbC2386c6afD4D580786458D7" as `0x${string}`;

const zeroGTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  network: '0g-testnet',
  nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
  rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
});

export async function deployTournament(tournament: string, appId: string): Promise<string> {
  console.log(`Deploying tournament ${appId} to Phala Cloud...`);

  if (!process.env.PHALA_CLOUD_API_KEY) {
    throw new Error('PHALA_CLOUD_API_KEY environment variable is required');
  }

  const client = createClient({ apiKey: process.env.PHALA_CLOUD_API_KEY });
  const provision = await client.provisionCvm({
    name: appId,
    vcpu: 1,
    memory: 2048,
    diskSize: 20,
    instance_type: "tdx.small",
    compose_file: {
      public_logs: true,
      public_sysinfo: true,
      gateway_enabled: true,
      docker_compose_file: `
services:
  referee:
    image: alexgubin/deviant-referee:v0.2.0
    ports:
      - "80:80"
    environment:
      - AGENT1_URL=http://agent1:8080/move
      - AGENT2_URL=http://agent2:8080/move
      - FACTORY_ADDRESS=${FACTORY_ADDRESS}
      - TOURNAMENT_ADDRESS=${tournament}
      - RPC_URL=${RPC_URL}
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
    depends_on:
      agent1:
        condition: service_started
      agent2:
        condition: service_started

  agent1:
    image: alexgubin/deviant-agent-base:v0.2.0
    environment:
      - AGENT_INDEX=0
      - RPC_URL=${RPC_URL}
      - FACTORY_ADDRESS=${FACTORY_ADDRESS}
      - TOURNAMENT_ADDRESS=${tournament}
      - AGENT_ID_ADDRESS=${AGENT_ID_ADDRESS}
    volumes:
      - agent1_data:/data
      - /var/run/dstack.sock:/var/run/dstack.sock

  agent2:
    image: alexgubin/deviant-agent-base:v0.2.0
    environment:
      - AGENT_INDEX=1
      - RPC_URL=${RPC_URL}
      - FACTORY_ADDRESS=${FACTORY_ADDRESS}
      - TOURNAMENT_ADDRESS=${tournament}
      - AGENT_ID_ADDRESS=${AGENT_ID_ADDRESS}
    volumes:
      - agent2_data:/data
      - /var/run/dstack.sock:/var/run/dstack.sock

volumes:
  agent1_data:
  agent2_data:
`
    }
  });

  const cvm = await client.commitCvmProvision({
    app_id: provision.app_id!,
    compose_hash: provision.compose_hash!,
  });

  console.log("CVM deployed:", cvm);

  return cvm.id.toString();
}

async function handleTournamentStarted(publicClient: PublicClient, tournamentAddress: `0x${string}`, category: string, id: bigint) {
  console.log(`\n[Watcher] TournamentStarted event detected at ${tournamentAddress} for category ${category} with id ${id}`);

  try {
    const appId = `${category}-${id.toString()}`;
    const taskId = await deployTournament(tournamentAddress, appId);
    console.log(`[Watcher] Deployment successful. Task ID: ${taskId}`);
  } catch (error) {
    console.error(`[Watcher] Failed to process tournament ${tournamentAddress}:`, error);
  }
}

async function main() {
  const publicClient = createPublicClient({
    chain: zeroGTestnet,
    transport: http()
  });

  console.log("[Watcher] Started, listening for TournamentCreated events...");
  console.log(`[Watcher] Factory Address: ${FACTORY_ADDRESS}`);

  publicClient.watchEvent({
    address: FACTORY_ADDRESS,
    event: parseAbiItem('event TournamentCreated(address indexed tournamentAddress, string category, uint256 id)'),
    onLogs: async (logs) => {
      for (const log of logs) {
        if (log.args.tournamentAddress && log.args.category === "chess" && log.args.id) {
          await handleTournamentStarted(publicClient, log.args.tournamentAddress, log.args.category, log.args.id);
        } else {
          console.log("[Watcher] TournamentCreated event ignored:", log);
        }
      }
    }
  });

  // Keep process alive
  process.stdin.resume();
}

// Only run main if executed directly
if (require.main === module) {
  main().catch(console.error);
}
