import { Chess } from 'chess.js';
import { OpenAI } from 'openai';

/**
 * COMPREHENSIVE LLM CHESS AGENT
 * This agent uses an LLM to analyze the board state and suggest the best move.
 * It features:
 * - Chain-of-Thought (CoT) prompting for better tactical awareness.
 * - ASCII board representation for spatial reasoning.
 * - Robust move validation and extraction.
 * - Strategic fallback mechanism (captures > checks > random).
 */

// --- Configuration ---
const CONFIG = {
    apiKey: process.env.OPENAI_API_KEY || "sk-46415774-6ee3-4346-8182-a3c6e87d41be",
    baseUrl: process.env.OPENAI_BASE_URL || "https://router-api.0g.ai/v1",
    model: process.env.OPENAI_MODEL || "deepseek/deepseek-chat-v3-0324",
    maxTokens: 20,
    temperature: 0.2,
};

const client = new OpenAI({
    baseURL: CONFIG.baseUrl,
    apiKey: CONFIG.apiKey,
});

/**
 * Formats a move into UCI format (e.g., e2e4 or e7e8q).
 */
function toUci(move: any): string {
    return `${move.from}${move.to}${move.promotion || ''}`;
}

/**
 * Heuristic-based fallback move selection.
 * Used when the LLM fails to provide a valid move.
 */
function getHeuristicMove(chess: Chess): string {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return "";

    // 1. Prioritize checkmates (if any)
    const checkmates = moves.filter(m => {
        const c = new Chess(chess.fen());
        c.move(m);
        return c.isCheckmate();
    });
    if (checkmates.length > 0) return toUci(checkmates[0]);

    // 2. Prioritize captures of high-value pieces
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const captures = moves
        .filter(m => m.captured)
        .sort((a, b) => values[b.captured!] - values[a.captured!]);
    if (captures.length > 0) return toUci(captures[0]);

    // 3. Prioritize checks
    const checks = moves.filter(m => {
        const c = new Chess(chess.fen());
        c.move(m);
        return c.isCheck();
    });
    if (checks.length > 0) return toUci(checks[Math.floor(Math.random() * checks.length)]);

    // 4. Random legal move
    return toUci(moves[Math.floor(Math.random() * moves.length)]);
}

/**
 * Main function to get the best move from the LLM.
 */
export async function get_move(fen: string): Promise<string> {
    const chess = new Chess(fen);
    const validMoves = chess.moves({ verbose: true });

    if (validMoves.length === 0) return "";

    const validUciMoves = validMoves.map(toUci);
    const turn = chess.turn() === 'w' ? 'White' : 'Black';

    // We build a detailed prompt to help the LLM understand the position.
    const systemPrompt = `You are a Chess Grandmaster. Analyze the current position and provide the best move.
Analysis Strategy:
- Check for immediate tactical wins (hanging pieces, mate in 1, forks).
- Evaluate piece activity and center control.
- Ensure king safety.
- Use Chain-of-Thought reasoning to explain your move selection.

Output format:
Move: <uci_move> (e.g., e2e4)`;

    const userPrompt = `Position (FEN): ${fen}
Board Visualization:
${chess.ascii()}

It is ${turn}'s turn to move.
List of Legal Moves: ${validUciMoves.join(', ')}

Provide your thought process followed by the best move in UCI format.`;

    try {
        const response = await client.chat.completions.create({
            model: CONFIG.model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: CONFIG.temperature,
            max_tokens: CONFIG.maxTokens,
        });

        const content = response.choices[0].message.content || "";

        // Robust move extraction using regex
        const moveMatch = content.match(/Move:\s*([a-h][1-8][a-h][1-8][qrbn]?)/i);
        let move = moveMatch ? moveMatch[1].toLowerCase() : "";

        if (!move) {
            // Fallback: search for any legal UCI move mentioned in the text
            const words = content.split(/\s+/);
            for (const word of words) {
                const cleaned = word.replace(/[^a-z0-9]/gi, '').toLowerCase();
                if (validUciMoves.includes(cleaned)) {
                    move = cleaned;
                    break;
                }
            }
        }

        if (validUciMoves.includes(move)) {
            console.log(`[LLM Agent] Selected Move: ${move}`);
            return move;
        }

        console.warn(`[LLM Agent] LLM suggested invalid move: "${move}". Using heuristic fallback.`);
        return getHeuristicMove(chess);

    } catch (error) {
        console.error("[LLM Agent] Error calling LLM API:", error);
        return getHeuristicMove(chess);
    }
}
