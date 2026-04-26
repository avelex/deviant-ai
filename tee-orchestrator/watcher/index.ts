import { spawn } from 'child_process';
import * as path from 'path';
import { createPublicClient, http, parseAbiItem, parseAbi, PublicClient } from 'viem';
import { defineChain } from 'viem';
import 'dotenv/config';

const TAPP_EXAMPLES_DIR = path.resolve(__dirname, '../../../.references/og-tapp/examples');
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

export async function deployTournament(agent1Hash: string, agent2Hash: string, category: string, id: bigint): Promise<string> {
    console.log(`Deploying TAPP for agents: ${agent1Hash} vs ${agent2Hash}`);

    const composePath = path.resolve(__dirname, '../docker-compose.template.yml');

    return new Promise((resolve, reject) => {
        const script = path.join(TAPP_EXAMPLES_DIR, 'start_app.sh');

        const env = {
            ...process.env,
            TAPP_OWNER_PRIVATE_KEY: process.env.TAPP_OWNER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001",
            AGENT1_HASH: agent1Hash,
            AGENT2_HASH: agent2Hash
        };

        const args = [
            '--host', 'localhost',
            '--port', '50051',
            '--app-id', `${category}-${id}`,
            '--compose-file', composePath,
            '--use-owner'
        ];

        console.log(`Executing: ${script} ${args.join(' ')}`);

        // Executing the start_app.sh
        const child = spawn(script, args, { env });

        let output = '';
        child.stdout.on('data', (data) => {
            const str = data.toString();
            output += str;
            console.log(`[TAPP Deploy] ${str.trim()}`);
        });
        child.stderr.on('data', (data) => console.error(`[TAPP Error] ${data.toString().trim()}`));

        child.on('close', (code) => {
            if (code !== 0) return reject(new Error(`Tapp deployment failed: ${code}`));
            const match = output.match(/Task ID:\s*([a-zA-Z0-9-]+)/);
            if (match) resolve(match[1]);
            else resolve("unknown-task-id");
        });
    });
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

        const taskId = await deployTournament(hashes[0], hashes[1]);
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
