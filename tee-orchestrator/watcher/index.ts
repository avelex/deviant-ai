import { spawn } from 'child_process';
import * as path from 'path';
import { createPublicClient, http, parseAbiItem, parseAbi, PublicClient } from 'viem';
import { defineChain } from 'viem';
import 'dotenv/config';
import { createClient } from "@phala/cloud";

const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";
const FACTORY_ADDRESS = "0x6eaD71726d122a08061Cba1BA2Cdb7580d0c2B55" as `0x${string}`;
const AGENT_ID_ADDRESS = "0xd032112434295a340E5de9fe04d28b932E8B57DA" as `0x${string}`;

const zeroGTestnet = defineChain({
    id: 16602,
    name: '0G Testnet',
    network: '0g-testnet',
    nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
});

export async function deployTournament(agent1Hash: string, agent2Hash: string, appId: string): Promise<string> {
    console.log(`Deploying tournament ${appId} to Phala Cloud...`);
    console.log(`Agent 1: ${agent1Hash}`);
    console.log(`Agent 2: ${agent2Hash}`);

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
    image: alexgubin/deviant-referee:v0.1.0
    environment:
      - AGENT1_URL=http://agent1:8080/move
      - AGENT2_URL=http://agent2:8080/move
    volumes:
      - /var/run/dstack.sock:/var/run/dstack.sock
    depends_on:
      agent1:
        condition: service_started
      agent2:
        condition: service_started

  agent1:
    image: alexgubin/deviant-agent-base:v0.1.0
    environment:
      - SCRIPT_HASH=${agent1Hash}
    volumes:
      - agent1_data:/data
      - /var/run/dstack.sock:/var/run/dstack.sock

  agent2:
    image: alexgubin/deviant-agent-base:v0.1.0
    environment:
      - SCRIPT_HASH=${agent2Hash}
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

    const tournamentAbi = parseAbi([
        'function getAgentKeys() external view returns (uint256[])'
    ]);

    const inftAbi = parseAbi([
        'struct IntelligentData { string dataDescription; bytes32 dataHash; }',
        'function intelligentDatasOf(uint256 tokenId) external view returns (IntelligentData[])'
    ]);

    try {
        console.log(`[Watcher] Fetching Agent IDs for tournament...`);
        const agentKeys = await publicClient.readContract({
            address: tournamentAddress,
            abi: tournamentAbi,
            functionName: 'getAgentKeys'
        }) as bigint[];

        if (agentKeys.length < 2) {
            console.log(`[Watcher] Tournament has less than 2 agents, skipping.`);
            return;
        }

        console.log(`[Watcher] Found Agent IDs: ${agentKeys.join(', ')}`);

        // Fetch hashes for the first two agents
        const hashes = [];
        for (let i = 0; i < 2; i++) {
            const data = await publicClient.readContract({
                address: AGENT_ID_ADDRESS,
                abi: inftAbi,
                functionName: 'intelligentDatasOf',
                args: [agentKeys[i]]
            }) as { dataDescription: string, dataHash: string }[];

            // Find the script hash
            const scriptData = data.find(d => d.dataDescription === 'script');
            if (scriptData) {
                hashes.push(scriptData.dataHash);
                console.log(`[Watcher] Agent ${agentKeys[i]} Script Hash: ${scriptData.dataHash}`);
            } else {
                console.warn(`[Watcher] No script hash found for Agent ${agentKeys[i]}`);
                hashes.push("");
            }
        }

        const appId = `${category}-${id.toString()}`;
        const taskId = await deployTournament(hashes[0], hashes[1], appId);
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

    console.log("[Watcher] Started, listening for TournamentStarted events...");
    console.log(`[Watcher] Factory Address: ${FACTORY_ADDRESS}`);

    publicClient.watchEvent({
        address: FACTORY_ADDRESS,
        event: parseAbiItem('event TournamentStarted(address indexed tournamentAddress, string category, uint256 id)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                if (log.args.tournamentAddress && log.args.category === "chess" && log.args.id) {
                    await handleTournamentStarted(publicClient, log.args.tournamentAddress, log.args.category, log.args.id);
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
