import { Indexer } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';

const INDEXER_URL = process.env.INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";

export async function downloadScript(hash: string, destPath: string) {
    console.log(`[0G Storage] Downloading ${hash} to ${destPath}...`);
    const indexer = new Indexer(INDEXER_URL);
    
    try {
        // Ensure destination directory exists
        fs.mkdirSync(path.dirname(destPath), { recursive: true });

        // The Indexer.download method in TS SDK returns Promise<Error | null>
        const err = await indexer.download(hash, destPath, true);
        if (err) {
            throw err;
        }

        console.log(`[0G Storage] Successfully downloaded and saved to ${destPath}`);
    } catch (e: any) {
        console.error(`[0G Storage] Failed to download ${hash}: ${e.message}`);
        throw e;
    }
}
