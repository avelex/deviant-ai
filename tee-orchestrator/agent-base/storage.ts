import { Indexer } from '@0gfoundation/0g-ts-sdk';

const INDEXER_URL = process.env.INDEXER_URL!;

export async function downloadScript(hash: string): Promise<string> {
    console.log(`[0G Storage] Downloading ${hash}`);
    const indexer = new Indexer(INDEXER_URL);

    try {
        const [blob, err] = await indexer.downloadToBlob(hash);
        if (err) {
            throw err;
        }

        if (!blob) {
            throw new Error("Failed to download script content");
        }

        const text = await blob.text();
        console.log(`[0G Storage] Successfully downloaded`);
        return text;
    } catch (e: any) {
        console.error(`[0G Storage] Failed to download ${hash}: ${e.message}`);
        throw e;
    }
}
