import { Chess } from 'chess.js';

export function get_move(fen: string): string {
    const board = new Chess(fen);
    const moves = board.moves();
    if (moves.length === 0) {
        return "";
    }

    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    // chess.js move() returns a move object, we need the uci format
    // or we can use board.move(randomMove) then board.history({verbose: true}).pop().lan
    
    // Using a simpler approach if possible, but chess.js doesn't give UCI easily from moves()
    // Let's use verbose moves
    const verboseMoves = board.moves({ verbose: true });
    const move = verboseMoves[Math.floor(Math.random() * verboseMoves.length)];
    
    console.log(`Make move: ${move.from}${move.to}${move.promotion || ''}`);
    return `${move.from}${move.to}${move.promotion || ''}`;
}
