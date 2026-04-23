import os
import sys
import importlib.util
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI()

class MoveRequest(BaseModel):
    fen: str

# Expected location of the decrypted agent script mounted by the referee
AGENT_SCRIPT_PATH = "/shared/agent.py"

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
            raise HTTPException(status_code=500, detail="get_move function not found in agent script")
            
        move = agent_module.get_move(req.fen)
        return {"move": move}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)