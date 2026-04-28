// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Tournament} from "../../src/Tournament.sol";

contract SetLiveUri is Script {
    function run(address tournament, string calldata liveUri) public {
        vm.startBroadcast();
        Tournament tournamentContract = Tournament(tournament);
        tournamentContract.setLiveUri(liveUri);
        vm.stopBroadcast();
    }
}
