import express from 'express';
import { downloadScript } from './storage';
import { AgentExecutor } from './executor';
import { createPublicClient, http, parseAbiItem, parseAbi, defineChain } from 'viem';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const AGENT_SCRIPT_PATH = process.env.AGENT_SCRIPT_PATH || "/data/agent.ts";
const AGENT_INDEX = parseInt(process.env.AGENT_INDEX!); // 0 for agent 1, 1 for agent 2

const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";
const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || "0x71be3e225A2F46F3350B7374737a5341148Fa6A9") as `0x${string}`;
const TOURNAMENT_ADDRESS = process.env.TOURNAMENT_ADDRESS as `0x${string}`;
const AGENT_ID_ADDRESS = (process.env.AGENT_ID_ADDRESS || "0xd032112434295a340E5de9fe04d28b932E8B57DA") as `0x${string}`;

const zeroGTestnet = defineChain({
    id: 16602,
    name: '0G Testnet',
    network: '0g-testnet',
    nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
});

let isReady = false;

const executor = new AgentExecutor();

app.get('/health', (req, res) => {
    if (isReady) {
        res.json({ status: "ok" });
    } else {
        res.status(503).json({ status: "loading", detail: "Agent script not yet loaded" });
    }
});

app.post('/move', (req, res) => {
    const { fen } = req.body;
    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const move = executor.getMove(fen);
        res.json({ move });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

async function fetchAndLoadScript(publicClient: any) {
    console.log(`[Agent Base] Fetching script for tournament ${TOURNAMENT_ADDRESS}, agent index ${AGENT_INDEX}...`);

    const tournamentAbi = parseAbi([
        'function getAgentKeys() external view returns (uint256[])'
    ]);

    const inftAbi = parseAbi([
        'struct IntelligentData { string dataDescription; bytes32 dataHash; }',
        'function intelligentDatasOf(uint256 tokenId) external view returns (IntelligentData[])'
    ]);

    try {
        const agentKeys = await publicClient.readContract({
            address: TOURNAMENT_ADDRESS,
            abi: tournamentAbi,
            functionName: 'getAgentKeys'
        }) as bigint[];

        if (agentKeys.length <= AGENT_INDEX) {
            throw new Error(`Tournament has only ${agentKeys.length} agents, but index ${AGENT_INDEX} requested.`);
        }

        const agentId = agentKeys[AGENT_INDEX];
        console.log(`[Agent Base] Found Agent ID: ${agentId}`);

        const data = await publicClient.readContract({
            address: AGENT_ID_ADDRESS,
            abi: inftAbi,
            functionName: 'intelligentDatasOf',
            args: [agentId]
        }) as { dataDescription: string, dataHash: string }[];

        const scriptData = data.find(d => d.dataDescription === 'script');
        if (!scriptData) {
            throw new Error(`No script hash found for Agent ${agentId}`);
        }

        const scriptHash = scriptData.dataHash;
        console.log(`[Agent Base] Agent ${agentId} Script Hash: ${scriptHash}`);

        await downloadScript(scriptHash, AGENT_SCRIPT_PATH);
        await executor.loadScript(AGENT_SCRIPT_PATH);
        isReady = true;
        console.log(`[Agent Base] Script loaded successfully.`);

    } catch (error) {
        console.error(`[Agent Base] Failed to fetch or load script:`, error);
    }
}

function listenForTournamentStart() {
    const publicClient = createPublicClient({
        chain: zeroGTestnet,
        transport: http()
    });

    console.log(`[Agent Base] Listening for TournamentStarted events from Factory ${FACTORY_ADDRESS}...`);
    console.log(`[Agent Base] Target Tournament: ${TOURNAMENT_ADDRESS}`);

    publicClient.watchEvent({
        address: FACTORY_ADDRESS,
        event: parseAbiItem('event TournamentStarted(address indexed tournamentAddress, string category, uint256 id)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { tournamentAddress } = log.args;
                if (tournamentAddress && TOURNAMENT_ADDRESS && tournamentAddress.toLowerCase() === TOURNAMENT_ADDRESS.toLowerCase()) {
                    console.log(`[Agent Base] Matching TournamentStarted event detected. Initializing agent...`);
                    await fetchAndLoadScript(publicClient);
                }
            }
        }
    });
}

async function main() {
    app.listen(PORT, () => {
        console.log(`[Agent Base] HTTP server listening on port ${PORT}`);

        if (TOURNAMENT_ADDRESS) {
            listenForTournamentStart();
        } else {
            console.warn("[Agent Base] TOURNAMENT_ADDRESS not set. Event listener disabled.");
        }
    });
}

main().catch(err => {
    console.error("[Agent Base] Fatal error during startup:", err);
    process.exit(1);
});
