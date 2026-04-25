// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TournamentFactory} from "../../src/TournamentFactory.sol";

contract CreateTournament is Script {
    function run(address factory, string calldata name, string calldata category) public returns (address) {
        vm.startBroadcast();
        TournamentFactory factoryContract = TournamentFactory(factory);
        address tournamentAddress = factoryContract.createTournament(name, category, 0, 2, 0, 0);
        vm.stopBroadcast();

        console.log("Tournament created at address: ", tournamentAddress);

        return tournamentAddress;
    }
}

