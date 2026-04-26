import { Indexer, ZgFile } from '@0gfoundation/0g-ts-sdk';
import { ethers } from 'ethers';
import * as path from 'path';
import 'dotenv/config';

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error("Usage: ts-node upload.ts <file-path>");
        process.exit(1);
    }

    const evmRpc = process.env.RPC_URL || 'https://evmrpc-testnet.0g.ai';
    const indexerRpc = process.env.INDEXER_RPC || 'https://indexer-storage-testnet-turbo.0g.ai';
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        console.error("Error: PRIVATE_KEY environment variable is not set.");
        process.exit(1);
    }

    console.log(`[0G Upload] File: ${filePath}`);
    console.log(`[0G Upload] EVM RPC: ${evmRpc}`);
    console.log(`[0G Upload] Indexer RPC: ${indexerRpc}`);

    const provider = new ethers.JsonRpcProvider(evmRpc);
    const signer = new ethers.Wallet(privateKey, provider);
    const indexer = new Indexer(indexerRpc);

    try {
        const absolutePath = path.resolve(filePath);
        const file = await ZgFile.fromFilePath(absolutePath);

        console.log("[0G Upload] Calculating Merkle Tree...");
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr) {
            throw new Error(`Merkle tree error: ${treeErr}`);
        }

        const rootHash = tree!.rootHash();
        console.log(`[0G Upload] Root Hash: ${rootHash}`);

        console.log("[0G Upload] Uploading to 0G Storage...");
        const [tx, uploadErr] = await indexer.upload(file, evmRpc, signer);

        if (uploadErr) {
            throw new Error(`Upload error: ${uploadErr}`);
        }

        console.log("\n[0G Upload] SUCCESS!");

        await file.close();
    } catch (error: any) {
        console.error(`\n[0G Upload] FAILED: ${error.message}`);
        process.exit(1);
    }
}

main();
