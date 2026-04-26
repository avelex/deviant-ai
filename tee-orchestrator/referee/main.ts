import axios from 'axios';
import { Chess } from 'chess.js';
import { DstackClient } from '@phala/dstack-sdk';
import express from 'express';
import { createPublicClient, http, parseAbiItem, parseAbi, defineChain, PublicClient } from 'viem';

import { toViemAccountSecure } from '@phala/dstack-sdk/viem';
import { keccak256, encodePacked } from 'viem';

const client = new DstackClient();

const AGENT1_URL = process.env.AGENT1_URL || "http://agent1:8080/move";
const AGENT2_URL = process.env.AGENT2_URL || "http://agent2:8080/move";
const PORT = process.env.PORT || 80;
const MOVE_TIMEOUT = 60000;

const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";
const FACTORY_ADDRESS = (process.env.FACTORY_ADDRESS || "0x71be3e225A2F46F3350B7374737a5341148Fa6A9") as `0x${string}`;
const TOURNAMENT_ADDRESS = process.env.TOURNAMENT_ADDRESS as `0x${string}`;

const zeroGTestnet = defineChain({
    id: 16602,
    name: '0G Testnet',
    network: '0g-testnet',
    nativeCurrency: { name: '0G', symbol: '0G', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
});

// Memory storage for the game result and identity
let gameResult: any = null;
let identity: any = null;
let isGameStarted = false;
let agentIds: bigint[] = [];

async function getEthereumIdentity() {
    if (identity) return identity;
    try {
        const keyResult = await client.getKey('ethereum/main', 'wallet');
        const secureAccount = toViemAccountSecure(keyResult);
        identity = {
            walletKey: keyResult,
            ethAccount: secureAccount
        };
        return identity;
    } catch (e: any) {
        console.error(`Failed to derive TEE identity: ${e.message}`);
        return null;
    }
}

async function requestMove(url: string, fen: string): Promise<string | null> {
    try {
        const resp = await axios.post(url, { fen }, { timeout: MOVE_TIMEOUT });
        return resp.data.move;
    } catch (e: any) {
        console.error(`Error requesting move from ${url}: ${e.message}`);
        return null;
    }
}

async function waitAgents() {
    const agents = [
        { name: `Agent ${agentIds[0]?.toString()}`, url: AGENT1_URL.replace("/move", "/health") },
        { name: `Agent ${agentIds[1]?.toString()}`, url: AGENT2_URL.replace("/move", "/health") }
    ];

    console.log("Waiting for agents to be ready...");

    for (const agent of agents) {
        let ready = false;
        while (!ready) {
            try {
                const resp = await axios.get(agent.url, { timeout: 2000 });
                if (resp.status === 200) {
                    ready = true;
                    console.log(`${agent.name} is ready.`);
                }
            } catch (e) {
                console.log(`Waiting for ${agent.name}...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

async function playGame() {
    if (isGameStarted) return;
    isGameStarted = true;

    await waitAgents();

    const board = new Chess();
    const agent1Name = `Agent ${agentIds[0].toString()}`;
    const agent2Name = `Agent ${agentIds[1].toString()}`;
    const agent1Id = agentIds[0].toString();
    const agent2Id = agentIds[1].toString();

    console.log(`Starting chess match for tournament ${TOURNAMENT_ADDRESS}`);
    await client.emitEvent('deviant-referee', `Starting chess match for tournament ${TOURNAMENT_ADDRESS}`);
    console.log(`Agent IDs: White=${agent1Name}, Black=${agent2Name}`);

    while (!board.isGameOver()) {
        const currentTurn = board.turn();
        const url = currentTurn === 'w' ? AGENT1_URL : AGENT2_URL;
        const playerName = currentTurn === 'w' ? agent1Name : agent2Name;

        console.log(`Turn: ${playerName}`);
        const moveStr = await requestMove(url, board.fen());
        await client.emitEvent('deviant-referee', `Turn: ${currentTurn}, Player: ${playerName} makes move: ${moveStr} `);


        if (!moveStr) {
            console.log(`${playerName} failed to return a move. Game over.`);
            await client.emitEvent('deviant-referee', `${playerName} failed to return a move due to timeout or error. Game over.`);
            const winnerId = currentTurn === 'w' ? agent2Id : agent1Id;
            return { winnerId, reason: "timeout_or_error", pgn: board.pgn() };
        }

        try {
            const move = board.move(moveStr);
            if (!move) {
                console.log(`${playerName} made illegal move ${moveStr}. Game over.`);
                await client.emitEvent('deviant-referee', `${playerName} made illegal move ${moveStr}. Game over.`);
                const winnerId = currentTurn === 'w' ? agent2Id : agent1Id;
                return { winnerId, reason: "illegal_move", pgn: board.pgn() };
            }
            console.log(`Move played: ${moveStr}`);
            await client.emitEvent('deviant-referee', `${playerName} played move: ${moveStr}.`);
        } catch (e: any) {
            console.log(`${playerName} returned invalid move format ${moveStr}: ${e.message}. Game over.`);
            await client.emitEvent('deviant-referee', `${playerName} returned invalid move format ${moveStr}: ${e.message}. Game over.`);
            const winnerId = currentTurn === 'w' ? agent2Id : agent1Id;
            return { winnerId, reason: "invalid_format", pgn: board.pgn() };
        }
    }

    const isDraw = board.isDraw();
    const winnerId = isDraw ? "0" : (board.turn() === 'w' ? agent2Id : agent1Id);

    console.log(`Game finished. Winner: ${winnerId}`);
    await client.emitEvent('deviant-referee', `Game finished. Winner: ${winnerId}`);

    return { winnerId, reason: "normal", pgn: board.pgn() };
}

async function signAndAttest(result: any, tournament: string) {
    try {
        const id = await getEthereumIdentity();
        if (!id) throw new Error("Identity not available");

        // Generate Hardware Quote for the result hash (Audit Evidence)
        const resultHash = keccak256(Buffer.from(JSON.stringify(result)));
        const resultHashBytes = keccak256(Buffer.from(JSON.stringify(result)), "bytes")
        const quoteResult = await client.getQuote(resultHashBytes);

        // Prepare the message for the smart contract (matching Tournament.sol)
        // We sign the tournament address + winner ID + hash(Audit Evidence) to prevent replay attacks
        const messageHash = keccak256(encodePacked(
            ['address', 'uint256', 'bytes32'],
            [tournament as `0x${string}`, BigInt(result.winnerId), resultHash]
        ));

        const ethSignature = await id.ethAccount.signMessage({ message: { raw: messageHash } });

        return {
            result,
            tournament,
            winnerAgentId: result.winnerId,
            signer: {
                address: id.ethAccount.address,
                signature: ethSignature
            },
            attestation: {
                quote: quoteResult.quote,
                hash: resultHash,
                eventLog: quoteResult.event_log,
                signatureChain: id.walletKey.signature_chain
            }
        }
    } catch (e: any) {
        console.error(`Failed to generate attestation: ${e.message}`);
        return { ...result, error: e.message };
    }
}

async function fetchAgentIds(publicClient: PublicClient) {
    const tournamentAbi = parseAbi([
        'function getAgentKeys() external view returns (uint256[])'
    ]);

    try {
        const keys = await publicClient.readContract({
            address: TOURNAMENT_ADDRESS,
            abi: tournamentAbi,
            functionName: 'getAgentKeys'
        }) as bigint[];

        agentIds = keys;
        console.log(`[Referee] Fetched Agent IDs from contract: ${agentIds.map(id => id.toString()).join(', ')}`);
        await client.emitEvent('deviant-referee', `Fetched Agent IDs: ${JSON.stringify(keys)}`);
    } catch (error) {
        console.error("[Referee] Failed to fetch Agent IDs:", error);
    }
}

function listenForTournamentStart() {
    const publicClient = createPublicClient({
        chain: zeroGTestnet,
        transport: http()
    });

    console.log(`[Referee] Listening for TournamentStarted events from Factory ${FACTORY_ADDRESS}...`);
    console.log(`[Referee] Target Tournament: ${TOURNAMENT_ADDRESS}`);

    publicClient.watchEvent({
        address: FACTORY_ADDRESS,
        event: parseAbiItem('event TournamentStarted(address indexed tournamentAddress, string category, uint256 id)'),
        onLogs: async (logs) => {
            for (const log of logs) {
                const { tournamentAddress } = log.args;
                if (tournamentAddress && TOURNAMENT_ADDRESS && tournamentAddress.toLowerCase() === TOURNAMENT_ADDRESS.toLowerCase()) {
                    console.log(`[Referee] Matching TournamentStarted event detected. Initializing game...`);

                    await fetchAgentIds(publicClient);

                    if (agentIds.length < 2) {
                        console.error("[Referee] Insufficient agents found in tournament contract. Cannot start game.");
                        return;
                    }

                    playGame()
                        .then((res) => signAndAttest(res, TOURNAMENT_ADDRESS))
                        .then(finalResult => {
                            gameResult = finalResult;
                            console.log(`[Referee] Game over. Result signed and stored.`);
                        })
                        .catch(err => {
                            console.error("[Referee] Fatal error during game:", err);
                        });
                }
            }
        }
    });
}

const app = express();

app.get('/id', async (req, res) => {
    const id = await getEthereumIdentity();
    if (id) {
        res.json({ address: id.ethAccount.address });
    } else {
        res.status(500).json({ error: "Could not derive TEE identity" });
    }
});

app.get('/result', (req, res) => {
    if (gameResult) {
        res.json(gameResult);
    } else {
        res.status(404).json({ error: "Game still in progress or failed" });
    }
});

app.listen(PORT, () => {
    console.log(`Referee HTTP server listening on port ${PORT}`);

    if (TOURNAMENT_ADDRESS) {
        listenForTournamentStart();
    } else {
        console.warn("[Referee] TOURNAMENT_ADDRESS not set. Event listener disabled.");
    }
});
