// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Tournament} from "../src/Tournament.sol";
import {TournamentFactory} from "../src/TournamentFactory.sol";
import {AgentNFT} from "0g-agent-nft/AgentNFT.sol";

contract DemoFlow is Script {
    // function run(address factory, address tapp, uint256[] calldata tokenIds) public {
    //     vm.startBroadcast();
    //     TournamentFactory factoryContract = TournamentFactory(factory);

    //     address tournament = factoryContract.createTournament("Test Chess", "chess", 0, 2, 0, 0);

    //     factoryContract.setTournamentTappAddress(tournament, tapp);

    //     for (uint256 i = 0; i < tokenIds.length; i++) {
    //         uint256 tokenId = tokenIds[i];
    //         Tournament(tournament).joinTournament(tokenId);
    //     }

    //     Tournament(tournament).startTournament();
    //     vm.stopBroadcast();
    // }

    function run(address tournament, address tee, uint256[] calldata tokenIds) public {
        Tournament tournamentContract = Tournament(tournament);
        TournamentFactory factoryContract = TournamentFactory(address(tournamentContract.factory()));

        vm.startBroadcast();
        factoryContract.setTournamentTee(tournament, tee);

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            Tournament(tournament).joinTournament(tokenId);
        }

        Tournament(tournament).startTournament();
        vm.stopBroadcast();
    }
}
