import os
import time
import json
import logging
import requests
import chess
import hashlib
from dstack_sdk import DstackClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

AGENT1_URL = os.environ.get("AGENT1_URL", "http://agent1:8080/move")
AGENT2_URL = os.environ.get("AGENT2_URL", "http://agent2:8080/move")
MOVE_TIMEOUT = 60

def request_move(url: str, fen: str) -> str:
    try:
        resp = requests.post(url, json={"fen": fen}, timeout=MOVE_TIMEOUT)
        resp.raise_for_status()
        return resp.json().get("move")
    except requests.exceptions.RequestException as e:
        logger.error(f"Error requesting move from {url}: {e}")
        return None

def play_game():
    board = chess.Board()
    logger.info("Starting chess match")
    
    # Wait for agents to start
    time.sleep(5)
    
    while not board.is_game_over():
        current_turn = board.turn
        url = AGENT1_URL if current_turn == chess.WHITE else AGENT2_URL
        player_name = "Agent 1 (White)" if current_turn == chess.WHITE else "Agent 2 (Black)"
        
        logger.info(f"Turn: {player_name}")
        move_str = request_move(url, board.fen())
        
        if not move_str:
            logger.info(f"{player_name} failed to return a move. Game over.")
            winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
            return {"winner": winner, "reason": "timeout_or_error", "pgn": board.fen()}
            
        try:
            move = chess.Move.from_uci(move_str)
            if move not in board.legal_moves:
                logger.info(f"{player_name} made illegal move {move_str}. Game over.")
                winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
                return {"winner": winner, "reason": "illegal_move", "pgn": board.fen()}
                
            board.push(move)
            logger.info(f"Move played: {move_str}")
        except Exception as e:
            logger.info(f"{player_name} returned invalid move format {move_str}: {e}. Game over.")
            winner = "Agent 2" if current_turn == chess.WHITE else "Agent 1"
            return {"winner": winner, "reason": "invalid_format", "pgn": board.fen()}
            
    # Game ended normally
    result = board.result()
    winner = "Draw"
    if result == "1-0":
        winner = "Agent 1"
    elif result == "0-1":
        winner = "Agent 2"
        
    logger.info(f"Game finished. Result: {result}")
    return {"winner": winner, "reason": "normal", "pgn": board.fen()}

def sign_and_attest(result):
    try:
        client = DstackClient()
        result_json = json.dumps(result, sort_keys=True)
        result_hash = hashlib.sha256(result_json.encode()).hexdigest()
        
        logger.info(f"Generating attestation for result hash: {result_hash}")
        
        # Derive a deterministic key using dstack-sdk
        # This uses the TEE's hardware-bound key derivation
        key = client.get_key(path="tournament-result", purpose="signing")
        
        # Generate a TDX quote for the result hash
        quote = client.get_quote(result_hash)
        
        result["attestation"] = {
            "quote": quote,
            "hash": result_hash,
            "signature": f"mock-signature-using-derived-key" # Mock signature for now
        }
    except Exception as e:
        logger.error(f"Failed to generate attestation: {e}")
        result["attestation"] = {"error": str(e)}
    return result

if __name__ == "__main__":
    import storage
    storage.setup_agent_scripts()
    result = play_game()
    result = sign_and_attest(result)
    print(f"FINAL_RESULT: {json.dumps(result)}")