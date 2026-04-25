// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {Script, console} from "forge-std/Script.sol";
import {AgentNFT} from "0g-agent-nft/AgentNFT.sol";
import {MockDataVerifier} from "../../src/mocks/MockDataVerifier.sol";

contract DeployAgentNFT is Script {
    function run() public {
        address admin = vm.envAddress("ADMIN");

        vm.startBroadcast();

        MockDataVerifier mockDataVerifier = new MockDataVerifier();
        AgentNFT implementation = new AgentNFT();

        bytes memory initData = abi.encodeCall(
            AgentNFT.initialize, ("Deviant Agent ID", "DAI", "storageInfo", address(mockDataVerifier), admin)
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(implementation), initData);

        vm.stopBroadcast();

        console.log("Implementation:", address(implementation));
        console.log("Proxy:", address(proxy));
    }
}
