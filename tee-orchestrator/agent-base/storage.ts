import { Indexer } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';

const INDEXER_URL = process.env.INDEXER_URL || "https://indexer-storage-testnet-turbo.0g.ai";

export async function downloadScript(hash: string, destPath: string) {
    console.log(`[0G Storage] Downloading ${hash} to ${destPath}...`);
    const indexer = new Indexer(INDEXER_URL);
    
    try {
        const fileInfo = await indexer.getFileInfo(hash);
        if (!fileInfo) {
            throw new Error(`File info not found for hash: ${hash}`);
        }

        console.log(`[0G Storage] File size: ${fileInfo.size} bytes`);
        const chunks = Math.ceil(fileInfo.size / (256 * 1024));
        let fileData = Buffer.alloc(0);

        for (let i = 0; i < chunks; i++) {
            const chunk = await indexer.download(hash, i);
            fileData = Buffer.concat([fileData, Buffer.from(chunk)]);
        }

        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.writeFileSync(destPath, fileData);
        console.log(`[0G Storage] Successfully downloaded and saved to ${destPath}`);
    } catch (e: any) {
        console.error(`[0G Storage] Failed to download ${hash}: ${e.message}`);
        throw e;
    }
}
