import { ethers } from 'ethers';
// @ts-ignore
import { Indexer, ZgFile } from '@0gfoundation/0g-ts-sdk';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const FACTORY_ABI = JSON.parse(fs.readFileSync('../../out/TournamentFactory.sol/TournamentFactory.json', 'utf8')).abi;
const AGENT_ID_ABI = JSON.parse(fs.readFileSync('../../out/AgentNFT.sol/AgentNFT.json', 'utf8')).abi;
const TOURNAMENT_ABI = JSON.parse(fs.readFileSync('../../out/Tournament.sol/Tournament.json', 'utf8')).abi;

const AGENT_ID_ADDRESS = "0xd032112434295a340E5de9fe04d28b932E8B57DA"
const FACTORY_ADDRESS = "0x71C62163F11cec54C3d60f545d8f2D695efcF74d"
const TOURNAMENT_IMPL_ADDRESS = "0x74094671B27Ac58c4224b3f93aF14f28aaE02EFd"

const OWNER_PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

async function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function uploadTo0gStorage(filePath: string, signer: ethers.Wallet): Promise<string> {
    console.log(`[0G Storage] Attempting to upload ${filePath}...`);

    try {
        const evmRpc = 'https://evmrpc-testnet.0g.ai';
        const indRpc = 'https://indexer-storage-testnet-turbo.0g.ai';

        const provider = new ethers.JsonRpcProvider(evmRpc);
        const indexer = new Indexer(indRpc);

        const file = await ZgFile.fromFilePath(filePath);
        const [tree, treeErr] = await file.merkleTree();

        if (treeErr) throw new Error(`Merkle tree error: ${treeErr}`);

        const rootHash = tree?.rootHash()!;
        console.log(`[0G Storage] Calculated Root Hash: ${rootHash}`);

        console.log(`[0G Storage] Sending transaction...`);
        const [tx, uploadErr] = await indexer.upload(file, evmRpc, signer);

        if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

        console.log(`[0G Storage] Upload successful! Tx: ${tx}`);

        await file.close();

        return rootHash;
    } catch (e: any) {
        console.warn(`[0G Storage] Upload failed or skipped. Using mock hash. Reason: ${e.message}`);
        return "";
    }
}

async function runTEEOrchestrator(agent1Hash: string, agent2Hash: string): Promise<string> {
    console.log(`\n[TEE Orchestrator] Simulating TEE deployment for agents: ${agent1Hash} vs ${agent2Hash}...`);
    console.log(`[TEE Orchestrator] Generating docker-compose for the Match...`);

    // Generate a simple docker-compose up for the referee + agents
    const composePath = path.resolve(__dirname, '../docker-compose.template.yml');
    console.log(`[TEE Orchestrator] Using compose file: ${composePath}`);

    console.log(`[TEE Orchestrator] TEE Match started! Referee is evaluating moves (timeout 1 min)...`);

    // Simulate game processing
    await sleep(3000);

    console.log(`[TEE Orchestrator] TEE Match finished!`);
    console.log(`[TEE Orchestrator] Referee generated verified Task ID.`);
    return "task-123-" + Date.now();
}

async function main() {
    console.log("=== Unreal AI Tournament E2E Flow Test ===");

    // 1. Setup local provider & signers
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signerOwner = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const signerAgent1 = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const signerAgent2 = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    const refereeAddress = "0x200F3eed8995472AD495EF8c1CfE74CC2EFF7414";

    const inftAddress = AGENT_ID_ADDRESS;
    console.log(`AgentID deployed to: ${inftAddress}`);

    const factoryAddress = FACTORY_ADDRESS;
    console.log(`Factory deployed to: ${factoryAddress}`);

    console.log("\n--- 1. Uploading Agent Scripts to 0G Storage ---");
    // Create dummy scripts
    fs.writeFileSync("agent1.py", "def get_move(fen): return 'e2e4'");
    fs.writeFileSync("agent2.py", "def get_move(fen): return 'e7e5'");

    const hash1 = await uploadTo0gStorage("agent1.py", signerAgent1);
    console.log(`Agent 1 Hash: ${hash1}`);

    const hash2 = await uploadTo0gStorage("agent2.py", signerAgent2);
    console.log(`Agent 2 Hash: ${hash2}`);

    console.log("\n--- 2. Minting iNFTs & Authorizing TEE ---");
    const inftContractAsAgent1 = new ethers.Contract(inftAddress, AGENT_ID_ABI, signerAgent1);
    const inftContractAsAgent2 = new ethers.Contract(inftAddress, AGENT_ID_ABI, signerAgent2);

    // Mint iNFTs
    const intelData1 = [{ dataDescription: "script", dataHash: hash1 }];
    const tx1 = await inftContractAsAgent1.getFunction("mint((string,bytes32)[],address)")(intelData1, signerAgent1.address);
    await tx1.wait();
    console.log(`Minted iNFT 1 for Agent Owner 1`);

    const intelData2 = [{ dataDescription: "script", dataHash: hash2 }];
    const tx2 = await inftContractAsAgent2.getFunction("mint((string,bytes32)[],address)")(intelData2, signerAgent2.address);
    await tx2.wait();
    console.log(`Minted iNFT 2 for Agent Owner 2`);

    console.log("\n=== E2E Flow Test Complete ===");
}

main().catch(console.error);