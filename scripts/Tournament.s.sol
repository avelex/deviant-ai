// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Tournament} from "../src/Tournament.sol";

contract DeployTournamentImplementation is Script {
    function run() public {
        vm.startBroadcast();
        Tournament implementation = new Tournament();
        vm.stopBroadcast();

        console.log("Implementation:", address(implementation));
    }
}
