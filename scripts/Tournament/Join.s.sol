// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Tournament} from "../../src/Tournament.sol";

contract JoinTournament is Script {
    function run(address tournament, uint256 tokenId) public {
        vm.startBroadcast();
        Tournament tournamentContract = Tournament(tournament);
        tournamentContract.joinTournament(tokenId);
        vm.stopBroadcast();
    }
}
