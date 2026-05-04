import { Chess } from 'chess.js';
import { OpenAI } from 'openai';

const apiKey = "sk-a0775c5c-72ab-46eb-a3e3-6e406c617b17";
const serviceUrl = "https://router-api-testnet.integratenetwork.work/v1"

const client = new OpenAI({
    baseURL: serviceUrl,
    apiKey: apiKey,
});

export async function get_move(fen: string): Promise<string> {
    const board = new Chess(fen);
    const moves = board.moves();
    if (moves.length === 0) {
        return "";
    }

    const systemPrompt = `You are a chess grandmaster. Given a chess position in FEN format and a list of valid moves, provide the best move in UCI format (e.g., e2e4). 
    Respond ONLY with the move, no explanation.`;

    const userPrompt = `FEN: ${fen}\nValid moves: ${board.moves({ verbose: true }).map(m => `${m.from}${m.to}${m.promotion || ''}`).join(', ')}`;

    try {
        const response = await client.chat.completions.create({
            model: "qwen/qwen-2.5-7b-instruct",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0,
        });

        const bestMove = response.choices[0].message.content?.trim() || "";

        // Basic validation: check if the returned move is in the list of valid moves
        const verboseMoves = board.moves({ verbose: true });
        const validUciMoves = verboseMoves.map(m => `${m.from}${m.to}${m.promotion || ''}`);

        if (validUciMoves.includes(bestMove)) {
            console.log(`LLM chose best move: ${bestMove}`);
            return bestMove;
        } else {
            console.warn(`LLM chose invalid move: ${bestMove}. Falling back to random.`);
            const move = verboseMoves[Math.floor(Math.random() * verboseMoves.length)];
            return `${move.from}${move.to}${move.promotion || ''}`;
        }
    } catch (error) {
        console.error("Error getting move from LLM:", error);
        const verboseMoves = board.moves({ verbose: true });
        const move = verboseMoves[Math.floor(Math.random() * verboseMoves.length)];
        return `${move.from}${move.to}${move.promotion || ''}`;
    }
}
