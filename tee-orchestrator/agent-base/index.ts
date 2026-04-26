import express from 'express';
import { downloadScript } from './storage';
import { AgentExecutor } from './executor';
import * as fs from 'fs';

const app = express();
app.use(express.json());

const SCRIPT_HASH = process.env.SCRIPT_HASH;
const AGENT_SCRIPT_PATH = process.env.AGENT_SCRIPT_PATH || "/data/agent.ts";
const PORT = process.env.PORT || 8080;

const executor = new AgentExecutor();

app.get('/health', (req, res) => {
    res.json({ status: "ok" });
});

app.post('/move', (req, res) => {
    const { fen } = req.body;
    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const move = executor.getMove(fen);
        res.json({ move });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

async function start() {
    if (SCRIPT_HASH) {
        await downloadScript(SCRIPT_HASH, AGENT_SCRIPT_PATH);
    } else {
        console.warn("[Agent Base] SCRIPT_HASH not provided, skipping download.");
    }

    if (fs.existsSync(AGENT_SCRIPT_PATH)) {
        await executor.loadScript(AGENT_SCRIPT_PATH);
    }

    app.listen(PORT, () => {
        console.log(`[Agent Base] Listening on port ${PORT}`);
    });
}

start().catch(err => {
    console.error("[Agent Base] Fatal error during startup:", err);
    process.exit(1);
});
