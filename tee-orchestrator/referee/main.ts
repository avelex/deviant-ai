import axios from 'axios';
import { Chess } from 'chess.js';

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

async function playGame() {
    const board = new Chess();
    console.log("Starting chess match");

    // Wait for agents to start
    await new Promise(resolve => setTimeout(resolve, 10000));

    while (!board.isGameOver()) {
        const currentTurn = board.turn();
        const url = currentTurn === 'w' ? AGENT1_URL : AGENT2_URL;
        const playerName = currentTurn === 'w' ? "Agent 1 (White)" : "Agent 2 (Black)";

        console.log(`Turn: ${playerName}`);
        const moveStr = await requestMove(url, board.fen());

        if (!moveStr) {
            console.log(`${playerName} failed to return a move. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "timeout_or_error", pgn: board.fen() };
        }

        try {
            const move = board.move(moveStr);
            if (!move) {
                console.log(`${playerName} made illegal move ${moveStr}. Game over.`);
                const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
                return { winner, reason: "illegal_move", pgn: board.fen() };
            }
            console.log(`Move played: ${moveStr}`);
        } catch (e: any) {
            console.log(`${playerName} returned invalid move format ${moveStr}: ${e.message}. Game over.`);
            const winner = currentTurn === 'w' ? "Agent 2" : "Agent 1";
            return { winner, reason: "invalid_format", pgn: board.fen() };
        }
    }

    const winner = board.isDraw() ? "Draw" : (board.turn() === 'w' ? "Agent 2" : "Agent 1");
    console.log(`Game finished. Winner: ${winner}`);
    return { winner, reason: "normal", pgn: board.fen() };
}
