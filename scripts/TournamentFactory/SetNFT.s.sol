// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TournamentFactory} from "../../src/TournamentFactory.sol";

contract SetNFT is Script {
    function run(address factory, address nftAddress) public {
        vm.startBroadcast();
        TournamentFactory factoryContract = TournamentFactory(factory);
        factoryContract.setAgentNFT(nftAddress);
        vm.stopBroadcast();
    }
}

