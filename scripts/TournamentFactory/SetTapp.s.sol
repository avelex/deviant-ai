// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TournamentFactory} from "../../src/TournamentFactory.sol";

contract SetTapp is Script {
    function run(address factory, address tournament, address tapp) public {
        vm.startBroadcast();
        TournamentFactory factoryContract = TournamentFactory(factory);
        factoryContract.setTournamentTappAddress(tournament, tapp);
        vm.stopBroadcast();
    }
}

