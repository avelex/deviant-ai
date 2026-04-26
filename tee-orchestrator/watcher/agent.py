import chess
import random


def get_move(fen: str) -> str:
    board = chess.Board(fen)
    moves = list(board.legal_moves)
    if len(moves) == 0:
        return ""

    randomMove = moves[random.randint(0, len(moves) - 1)]
    print(f"Make move: {randomMove.uci()}")
    return randomMove.uci()
