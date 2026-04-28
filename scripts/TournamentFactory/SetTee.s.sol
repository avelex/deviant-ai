// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TournamentFactory} from "../../src/TournamentFactory.sol";

contract SetTee is Script {
    function run(address factory, address tournament, address tee) public {
        vm.startBroadcast();
        TournamentFactory factoryContract = TournamentFactory(factory);
        factoryContract.setTournamentTee(tournament, tee);
        vm.stopBroadcast();
    }
}

