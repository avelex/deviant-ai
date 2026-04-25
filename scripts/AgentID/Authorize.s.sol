// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Script, console} from "forge-std/Script.sol";
import {AgentNFT} from "0g-agent-nft/AgentNFT.sol";
import {MockDataVerifier} from "../../src/mocks/MockDataVerifier.sol";

contract AuthorizeAgent is Script {
    function run(address agentNFT, uint256 tokenId, address user) public {
        address[] memory users = new address[](1);
        users[0] = user;

        vm.startBroadcast();
        AgentNFT agentNFTContract = AgentNFT(agentNFT);
        agentNFTContract.batchAuthorizeUsage(tokenId, users);
        vm.stopBroadcast();
    }
}
