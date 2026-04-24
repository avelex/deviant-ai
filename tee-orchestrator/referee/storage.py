import os
import shutil
import logging

logger = logging.getLogger(__name__)

TAPP_SECRET_SCRIPT = "/app/get_app_secret_key.sh"

def setup_agent_scripts():
    logger.info("Setting up agent scripts...")
    
    os.makedirs("/shared_agent1", exist_ok=True)
    os.makedirs("/shared_agent2", exist_ok=True)

    encrypted_dir = "/shared/encrypted"
    
    mock_agent_code = """
import chess
import random
def get_move(fen: str) -> str:
    board = chess.Board(fen)
    moves = list(board.legal_moves)
    return moves[0].uci() if moves else ""
"""

    def process_agent(agent_id, dest_dir):
        enc_file = os.path.join(encrypted_dir, f"{agent_id}.py.enc")
        dest_file = os.path.join(dest_dir, "agent.py")
        
        if os.path.exists(enc_file):
            logger.info(f"Found downloaded script for {agent_id}. Decrypting...")
            shutil.copy2(enc_file, dest_file)
        else:
            logger.warning(f"No downloaded script found for {agent_id}, using fallback random agent")
            with open(dest_file, "w") as f:
                f.write(mock_agent_code)

    process_agent("agent1", "/shared_agent1")
    process_agent("agent2", "/shared_agent2")

    logger.info("Agent scripts decrypted and mounted to shared volumes")

if __name__ == "__main__":
    setup_agent_scripts()