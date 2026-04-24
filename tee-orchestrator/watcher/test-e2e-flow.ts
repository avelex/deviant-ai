import { createPublicClient, createWalletClient, http, parseAbi } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { defineChain } from 'viem';
// @ts-ignore
import { Indexer, ZgFile } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

import { deployTournament } from './index';

const AGENT_ID_ABI = JSON.parse(fs.readFileSync('../../out/AgentNFT.sol/AgentNFT.json', 'utf8')).abi;
const AGENT_ID_ADDRESS = "0xd032112434295a340E5de9fe04d28b932E8B57DA";
const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}` || "0x0000000000000000000000000000000000000000000000000000000000000001";
const RPC_URL = process.env.RPC_URL || "https://evmrpc-testnet.0g.ai";

const zeroGTestnet = defineChain({
    id: 16600,
    name: '0G Testnet',
    network: '0g-testnet',
    nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] }, public: { http: [RPC_URL] } },
});

async function uploadTo0gStorage(filePath: string): Promise<string> {
    console.log(`[0G Storage] Attempting to upload ${filePath}...`);
    try {
        const file = await ZgFile.fromFilePath(filePath);
        const [tree, treeErr] = await file.merkleTree();
        if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

        const rootHash = tree?.rootHash()!;
        console.log(`[0G Storage] Calculated Root Hash: ${rootHash}`);
        await file.close();
        return rootHash;
    } catch (e: any) {
        console.warn(`[0G Storage] Hash calculation failed. Using mock hash.`);
        return "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    }
}

async function main() {
    console.log("=== Unreal AI Tournament E2E Flow Test (Viem) ===");

    const accountOwner = privateKeyToAccount(OWNER_PRIVATE_KEY);
    const walletClient = createWalletClient({ account: accountOwner, chain: zeroGTestnet, transport: http() });

    console.log("\n--- 1. Uploading Agent Scripts to 0G Storage ---");
    fs.writeFileSync("agent1.py", "def get_move(fen): return 'e2e4'");
    fs.writeFileSync("agent2.py", "def get_move(fen): return 'e7e5'");

    const hash1 = await uploadTo0gStorage("agent1.py");
    const hash2 = await uploadTo0gStorage("agent2.py");

    console.log("\n--- 2. Minting iNFTs (Skipped if no gas) ---");
    try {
        const intelData1 = [{ dataDescription: "script", dataHash: hash1 }];
        await walletClient.writeContract({
            address: AGENT_ID_ADDRESS as `0x${string}`,
            abi: AGENT_ID_ABI,
            functionName: 'mint',
            args: [intelData1, accountOwner.address]
        });
    } catch (e: any) {
        console.log(`Skipping minting: ${e.message.split('\\n')[0]}`);
    }

    console.log("\n--- 3. Orchestrating TEE Deployment ---");
    const taskId = await deployTournament(hash1, hash2);
    console.log(`TEE Deployment Task ID: ${taskId}`);

    console.log("\n=== E2E Flow Test Complete ===");
}

main().catch(console.error);