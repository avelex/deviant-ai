// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TournamentFactory} from "../src/TournamentFactory.sol";

contract DeployTournamentFactory is Script {
    function run(address agentIdAddress, address tournamentImpl) public {
        vm.startBroadcast();
        TournamentFactory implementation = new TournamentFactory(agentIdAddress, tournamentImpl);
        vm.stopBroadcast();

        console.log("Factory address:", address(implementation));
    }
}
