# Make Agent Executor Asynchronous Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the `AgentExecutor` and the agent base HTTP server to handle asynchronous `get_move` functions, enabling LLM-based agents.

**Architecture:**
1.  **Update `executor.ts`:** Change `getMove` to `async` and use `await` when calling the sandboxed `get_move` function.
2.  **Update `index.ts`:** Change the `/move` endpoint handler to `async` and `await` the result from `executor.getMove`.

**Tech Stack:** TypeScript, Express, Node.js (vm module)

---

### Task 1: Update AgentExecutor

**Files:**
- Modify: `tee-orchestrator/agent-base/executor.ts`

- [ ] **Step 1: Make `getMove` asynchronous**
```typescript
public async getMove(fen: string): Promise<string> {
    return await this.scriptInstance.get_move(fen);
}
```

- [ ] **Step 2: Commit**

### Task 2: Update Agent Base HTTP Server

**Files:**
- Modify: `tee-orchestrator/agent-base/index.ts`

- [ ] **Step 1: Make `/move` endpoint handler asynchronous**
```typescript
app.post('/move', async (req, res) => {
    const { fen } = req.body;
    if (!fen) {
        return res.status(400).json({ error: "FEN is required" });
    }

    try {
        const move = await executor.getMove(fen);
        res.json({ move });
    } catch (e: any) {
        console.error(`[Agent Base] Error generating move:`, e);
        res.status(500).json({ error: e.message });
    }
});
```

- [ ] **Step 2: Commit**
