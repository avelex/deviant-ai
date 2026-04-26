import os
import sys
import importlib.util
import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from core.indexer import Indexer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

INDEXER_URL = "https://indexer-storage-testnet-turbo.0g.ai"
SCRIPT_HASH = os.environ.get("SCRIPT_HASH")

app = FastAPI()


class MoveRequest(BaseModel):
    fen: str


# Expected location of the decrypted agent script mounted by the referee
AGENT_SCRIPT_PATH = "/data/agent.py"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/move")
def get_move(req: MoveRequest):
    if not os.path.exists(AGENT_SCRIPT_PATH):
        raise HTTPException(status_code=500, detail="Agent script not found")

    try:
        spec = importlib.util.spec_from_file_location("agent_module", AGENT_SCRIPT_PATH)
        agent_module = importlib.util.module_from_spec(spec)
        sys.modules["agent_module"] = agent_module
        spec.loader.exec_module(agent_module)

        if not hasattr(agent_module, "get_move"):
            raise HTTPException(
                status_code=500, detail="get_move function not found in agent script"
            )

        move = agent_module.get_move(req.fen)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def download_script():
    indexer = Indexer(INDEXER_URL)
    err = indexer.download(SCRIPT_HASH, AGENT_SCRIPT_PATH)

    if err is None:
        logger.info("Agent script downloaded successfully")
    else:
        logger.error(f"Failed to download agent script: {err}")
        sys.exit(1)


if __name__ == "__main__":
    download_script()
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
