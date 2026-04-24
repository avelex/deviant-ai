// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/TournamentFactory.sol";
import "../src/Tournament.sol";
import "../src/MockINFT.sol";
import "@openzeppelin-contracts/utils/cryptography/MessageHashUtils.sol";

contract TournamentTest is Test {
    TournamentFactory factory;
    MockINFT mockINFT;
    
    address organizer = address(0x1);
    address agentOwner1 = address(0x2);
    address agentOwner2 = address(0x3);
    address bettor = address(0x4);
    
    uint256 refereePrivateKey = 0x123456789;
    address referee;

    function setUp() public {
        referee = vm.addr(refereePrivateKey);
        mockINFT = new MockINFT();
        factory = new TournamentFactory(address(mockINFT));
        
        vm.deal(agentOwner1, 10 ether);
        vm.deal(agentOwner2, 10 ether);
        vm.deal(bettor, 10 ether);
    }

    function test_CreateAndJoinTournament() public {
        vm.prank(organizer);
        address tournamentAddr = factory.createTournament(
            1 ether, 2, 500, referee, block.timestamp + 3600
        );
        Tournament tournament = Tournament(tournamentAddr);

        mockINFT.mint(1, agentOwner1);
        mockINFT.authorize(1, referee);
        
        mockINFT.mint(2, agentOwner2);
        mockINFT.authorize(2, referee);

        vm.prank(agentOwner1);
        tournament.joinTournament{value: 1 ether}(1);
        assertEq(tournament.participantsCount(), 1);

        vm.prank(agentOwner2);
        tournament.joinTournament{value: 1 ether}(2);
        assertEq(uint(tournament.state()), uint(Tournament.TournamentState.Active));
    }

    function test_BetAndResolve() public {
        vm.prank(organizer);
        address tournamentAddr = factory.createTournament(
            1 ether, 2, 500, referee, block.timestamp + 3600
        );
        Tournament tournament = Tournament(tournamentAddr);

        mockINFT.mint(1, agentOwner1);
        mockINFT.authorize(1, referee);
        mockINFT.mint(2, agentOwner2);
        mockINFT.authorize(2, referee);

        vm.prank(agentOwner1);
        tournament.joinTournament{value: 1 ether}(1);

        vm.prank(bettor);
        tournament.placeBet{value: 2 ether}(1);
        assertEq(tournament.totalBetsPool(), 2 ether);

        vm.prank(agentOwner2);
        tournament.joinTournament{value: 1 ether}(2);

        // Resolve
        string memory taskId = "task-123";
        bytes32 messageHash = keccak256(abi.encodePacked(tournamentAddr, uint256(1), taskId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(refereePrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);

        tournament.resolveTournament(1, taskId, signature);
        assertEq(uint(tournament.state()), uint(Tournament.TournamentState.Finished));
    }
}