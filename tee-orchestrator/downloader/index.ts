import { Indexer } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';

const INDEXER_RPC = 'https://indexer-storage-testnet-turbo.0g.ai';
const SHARED_DIR = '/shared/encrypted';

async function downloadFile(hash: string, filename: string) {
    if (!hash || hash === "") {
        console.warn(`[Downloader] Hash for ${filename} is empty. Skipping download.`);
        return;
    }
    console.log(`[Downloader] Downloading ${hash} to ${filename}...`);
    try {
        const indexer = new Indexer(INDEXER_RPC);
        const outPath = path.join(SHARED_DIR, filename);
        
        const err = await indexer.download(hash, outPath, false);
        if (err) {
            throw err;
        }
        
        const stats = fs.statSync(outPath);
        console.log(`[Downloader] File size: ${stats.size} bytes`);
        console.log(`[Downloader] Successfully downloaded and saved to ${outPath}`);
    } catch (e: any) {
        console.error(`[Downloader] Failed to download ${hash}: ${e.message}`);
        process.exit(1);
    }
}

async function main() {
    console.log("[Downloader] Init container started.");
    
    if (!fs.existsSync(SHARED_DIR)) {
        fs.mkdirSync(SHARED_DIR, { recursive: true });
    }

    const agent1Hash = process.env.AGENT1_HASH || "";
    const agent2Hash = process.env.AGENT2_HASH || "";

    await downloadFile(agent1Hash, "agent1.py.enc");
    await downloadFile(agent2Hash, "agent2.py.enc");

    console.log("[Downloader] All downloads finished successfully.");
}

main().catch((err) => {
    console.error(`[Downloader] Fatal error:`, err);
    process.exit(1);
});
