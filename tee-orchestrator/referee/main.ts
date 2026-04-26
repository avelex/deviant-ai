import axios from 'axios';
import { Chess } from 'chess.js';
import { DstackClient } from '@phala/dstack-sdk';
import crypto from 'crypto';

const AGENT1_URL = process.env.AGENT1_URL || "http://agent1:8080/move";
const AGENT2_URL = process.env.AGENT2_URL || "http://agent2:8080/move";
const MOVE_TIMEOUT = 60000;

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
        { name: "Agent 1", url: AGENT1_URL.replace("/move", "/health") },
        { name: "Agent 2", url: AGENT2_URL.replace("/move", "/health") }
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
    await waitAgents();

    const board = new Chess();
    console.log("Starting chess match");

    while (!board.isGameOver()) {
        const currentTurn = board.turn();
        const url = currentTurn === 'w' ? AGENT1_URL : AGENT2_URL;
        const playerName = currentTurn === 'w' ? "Agent 1 (White)" : "Agent 2 (Black)";

        console.log(`Turn: ${playerName}`);
        const moveStr = await requestMove(url, board.fen());

        if (!moveStr) {
            console.log(`${playerName} failed to return a move. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "timeout_or_error", pgn: board.pgn() };
        }

        try {
            const move = board.move(moveStr);
            if (!move) {
                console.log(`${playerName} made illegal move ${moveStr}. Game over.`);
                const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
                return { winner, reason: "illegal_move", pgn: board.pgn() };
            }
            console.log(`Move played: ${moveStr}`);
        } catch (e: any) {
            console.log(`${playerName} returned invalid move format ${moveStr}: ${e.message}. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "invalid_format", pgn: board.pgn() };
        }
    }

    const winner = board.isDraw() ? "Draw" : (board.turn() === 'w' ? "Agent 2" : "Agent 1");
    console.log(`Game finished. Winner: ${winner}`);
    return { winner, reason: "normal", pgn: board.pgn() };
}

async function signAndAttest(result: any) {
    try {
        const client = new DstackClient();
        const isReachable = await client.isReachable();
        if (!isReachable) {
            console.log('dstack service is not available, skipping attestation');
            return result;
        }

        const resultJson = JSON.stringify(result, Object.keys(result).sort());
        const hash = crypto.createHash('sha256').update(resultJson).digest();

        console.log(`Generating attestation for result hash: ${hash.toString('hex')}`);

        // Derive deterministic keys for blockchain applications
        const walletKey = await client.getKey('wallet/ethereum', 'mainnet');
        console.log('Derived key (32 bytes):', walletKey.key);        // secp256k1 private key
        console.log('Signature chain:', walletKey.signature_chain);   // Authenticity proof

        // Get quote
        const quoteResult = await client.getQuote(hash);

        result.attestation = {
            quote: quoteResult.quote,
            hash: hash.toString('hex'),
            key: walletKey.key,
            signature_chain: walletKey.signature_chain
        };
    } catch (e: any) {
        console.error(`Failed to generate attestation: ${e.message}`);
        result.attestation = { error: e.message };
    }
    return result;
}

if (require.main === module) {
    playGame()
        .then(signAndAttest)
        .then(finalResult => {
            console.log(`FINAL_RESULT: ${JSON.stringify(finalResult)}`);
            process.exit(0);
        })
        .catch(err => {
            console.error("Fatal error:", err);
            process.exit(1);
        });
}
