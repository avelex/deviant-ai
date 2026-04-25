// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentNFT} from "0g-agent-nft/AgentNFT.sol";
import {IntelligentData} from "0g-agent-nft/interfaces/IERC7857Metadata.sol";

contract MintAgentID is Script {
    function run(address proxy, address to, bytes32 scriptHash) public {
        IntelligentData memory scriptData = IntelligentData({dataDescription: "script", dataHash: scriptHash});
        IntelligentData[] memory intelligentDatas = new IntelligentData[](1);
        intelligentDatas[0] = scriptData;
        AgentNFT agentNFT = AgentNFT(proxy);

        vm.startBroadcast();
        uint256 tokenId = agentNFT.mint(intelligentDatas, to);
        vm.stopBroadcast();

        console.log("Token ID:", tokenId);
    }
}
