// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Tournament.sol";
import "../src/TournamentFactory.sol";
import "../src/mocks/MockINFT.sol";

contract MockFactory {
    function notifyTournamentStarted(string calldata, uint256) external {}
}

contract TournamentRewardsTest is Test {
    Tournament tournament;
    MockINFT agentNFT;
    MockFactory mockFactory;
    address factory;
    address owner = address(0x456);
    uint256 teePrivateKey = 0x1234;
    address tee;
    address user1 = address(0x1);
    address user2 = address(0x2);
    address bettor1 = address(0xB1);
    address bettor2 = address(0xB2);

    uint256 constant SLOT_PRICE = 1 ether;
    uint256 constant FEE_RATE = 1000; // 10%
    uint256 constant MAX_SLOTS = 2;

    function setUp() public {
        tee = vm.addr(teePrivateKey);
        agentNFT = new MockINFT();
        mockFactory = new MockFactory();
        factory = address(mockFactory);
        tournament = new Tournament();
        
        ITournament.Config memory config = ITournament.Config({
            owner: owner,
            tee: tee,
            slotPrice: SLOT_PRICE,
            maxSlots: MAX_SLOTS,
            feeRate: uint16(FEE_RATE),
            createdAt: block.timestamp,
            startedAt: block.timestamp + 1 hours,
            finishedAt: 0,
            name: "Test",
            category: "Chess",
            id: 1,
            liveUri: ""
        });
        
        tournament.initialize(config, address(agentNFT), factory);
        
        // Setup agents
        agentNFT.mint(1, user1);
        agentNFT.mint(2, user2);
        
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
        vm.deal(bettor1, 10 ether);
        vm.deal(bettor2, 10 ether);
        vm.deal(owner, 10 ether);
    }

    function test_ClaimRewards_Winner() public {
        // 1. Join
        vm.prank(user1);
        tournament.joinTournament{value: SLOT_PRICE}(1);
        vm.prank(user2);
        tournament.joinTournament{value: SLOT_PRICE}(2);
        
        // 2. Bets
        vm.prank(bettor1);
        tournament.placeBet{value: 2 ether}(1); // 2 ETH on agent 1
        vm.prank(bettor2);
        tournament.placeBet{value: 3 ether}(2); // 3 ETH on agent 2
        
        // 3. Start & Resolve
        vm.warp(block.timestamp + 2 hours);
        vm.prank(factory);
        tournament.startTournament();
        
        uint256 winnerAgentId = 1;
        bytes32 resultHash = keccak256("result");
        bool noWinner = false;
        
        bytes32 messageHash = keccak256(abi.encodePacked(address(tournament), winnerAgentId, resultHash, noWinner));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(teePrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        tournament.resolveTournament(winnerAgentId, resultHash, signature, noWinner);
        
        // 4. Claim
        // Total Entry Fees: 2 ether
        // Total Bets Pool: 5 ether
        // Total Pool: 7 ether
        // Fee (10%): 0.7 ether
        // Net Entry Fees: 2 - 0.2 = 1.8 ether
        // Net Bets Pool: 5 - 0.5 = 4.5 ether
        
        // Organizer (owner) should get 0.7 ether
        uint256 ownerBalanceBefore = owner.balance;
        vm.prank(owner);
        tournament.claimRewards();
        assertEq(owner.balance - ownerBalanceBefore, 0.7 ether);
        
        // Agent 1 Owner (user1) should get 1.8 ether (net entry fees)
        uint256 user1BalanceBefore = user1.balance;
        vm.prank(user1);
        tournament.claimRewards();
        assertEq(user1.balance - user1BalanceBefore, 1.8 ether);
        
        // Bettor 1 (bettor1) should get all net bets pool because they are the only winner bettor
        // reward = (2 * 4.5) / 2 = 4.5 ether
        uint256 bettor1BalanceBefore = bettor1.balance;
        vm.prank(bettor1);
        tournament.claimRewards();
        assertEq(bettor1.balance - bettor1BalanceBefore, 4.5 ether);
        
        // Bettor 2 (bettor2) should get 0 because they bet on agent 2
        vm.prank(bettor2);
        vm.expectRevert("No rewards to claim");
        tournament.claimRewards();
    }

    function test_GetOdds() public {
        vm.prank(user1);
        tournament.joinTournament{value: SLOT_PRICE}(1);
        vm.prank(user2);
        tournament.joinTournament{value: SLOT_PRICE}(2);

        // Total Bets Pool = 10 ETH
        // Agent 1: 2 ETH
        // Agent 2: 8 ETH
        // Fee: 10%
        // Net Bets Pool: 9 ETH
        
        vm.prank(bettor1);
        tournament.placeBet{value: 2 ether}(1);
        vm.prank(bettor2);
        tournament.placeBet{value: 8 ether}(2);

        // Odds for Agent 1: (9 * 1e18) / 2 = 4.5 * 1e18
        assertEq(tournament.getOdds(1), 4.5 * 1e18);
        
        // Odds for Agent 2: (9 * 1e18) / 8 = 1.125 * 1e18
        assertEq(tournament.getOdds(2), 1.125 * 1e18);

        // Odds for non-existent or no-bet agent
        assertEq(tournament.getOdds(3), 0);
    }

    function test_ClaimRewards_NoWinner() public {
        // 1. Join
        vm.prank(user1);
        tournament.joinTournament{value: SLOT_PRICE}(1);
        vm.prank(user2);
        tournament.joinTournament{value: SLOT_PRICE}(2);
        
        // 2. Bets
        vm.prank(bettor1);
        tournament.placeBet{value: 2 ether}(1);
        vm.prank(bettor2);
        tournament.placeBet{value: 3 ether}(2);
        
        // 3. Start & Resolve
        vm.warp(block.timestamp + 2 hours);
        vm.prank(factory);
        tournament.startTournament();
        
        uint256 winnerAgentId = 0; // Doesn't matter if noWinner is true
        bytes32 resultHash = keccak256("result");
        bool noWinner = true;
        
        bytes32 messageHash = keccak256(abi.encodePacked(address(tournament), winnerAgentId, resultHash, noWinner));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(teePrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        tournament.resolveTournament(winnerAgentId, resultHash, signature, noWinner);
        
        // 4. Claim Refunds
        // Bettor 1 should get 2 ether back
        uint256 bettor1BalanceBefore = bettor1.balance;
        vm.prank(bettor1);
        tournament.claimRewards();
        assertEq(bettor1.balance - bettor1BalanceBefore, 2 ether);
        
        // Bettor 2 should get 3 ether back
        uint256 bettor2BalanceBefore = bettor2.balance;
        vm.prank(bettor2);
        tournament.claimRewards();
        assertEq(bettor2.balance - bettor2BalanceBefore, 3 ether);
        
        // User 1 should get 1 ether back
        uint256 user1BalanceBefore = user1.balance;
        vm.prank(user1);
        tournament.claimRewards();
        assertEq(user1.balance - user1BalanceBefore, 1 ether);
        
        // User 2 should get 1 ether back
        uint256 user2BalanceBefore = user2.balance;
        vm.prank(user2);
        tournament.claimRewards();
        assertEq(user2.balance - user2BalanceBefore, 1 ether);
        
        // Organizer should get 0
        vm.prank(owner);
        vm.expectRevert("No rewards to claim");
        tournament.claimRewards();
    }

    function test_ClaimRewards_Complex() public {
        // Owner is also an agent owner and a bettor
        agentNFT.mint(3, owner);
        vm.deal(owner, 100 ether);
        
        // Join
        vm.prank(owner);
        tournament.joinTournament{value: SLOT_PRICE}(3);
        vm.prank(user1);
        tournament.joinTournament{value: SLOT_PRICE}(1);
        
        // Bets
        vm.prank(owner);
        tournament.placeBet{value: 5 ether}(3); // Owner bets 5 ETH on themselves
        
        vm.prank(bettor1);
        tournament.placeBet{value: 5 ether}(3); // Bettor 1 bets 5 ETH on owner's agent
        
        // Start & Resolve (Owner wins)
        vm.warp(block.timestamp + 2 hours);
        vm.prank(factory);
        tournament.startTournament();
        
        uint256 winnerAgentId = 3;
        bytes32 resultHash = keccak256("result");
        bool noWinner = false;
        
        bytes32 messageHash = keccak256(abi.encodePacked(address(tournament), winnerAgentId, resultHash, noWinner));
        bytes32 ethSignedMessageHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", messageHash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(teePrivateKey, ethSignedMessageHash);
        bytes memory signature = abi.encodePacked(r, s, v);
        
        tournament.resolveTournament(winnerAgentId, resultHash, signature, noWinner);
        
        // Pool: 2 ether entry + 10 ether bets = 12 ether
        // Fee (10%): 1.2 ether
        // Net Entry Fees: 2 - 0.2 = 1.8 ether
        // Net Bets Pool: 10 - 1.0 = 9.0 ether
        
        // Owner should get:
        // Organizer Fee: 1.2 ether
        // Winning Agent Owner Reward: 1.8 ether
        // Winning Bettor Reward: (5 * 9) / 10 = 4.5 ether
        // Total: 1.2 + 1.8 + 4.5 = 7.5 ether
        
        uint256 ownerBalanceBefore = owner.balance;
        vm.prank(owner);
        tournament.claimRewards();
        assertEq(owner.balance - ownerBalanceBefore, 7.5 ether);
        
        // Bettor 1 should get: (5 * 9) / 10 = 4.5 ether
        uint256 bettor1BalanceBefore = bettor1.balance;
        vm.prank(bettor1);
        tournament.claimRewards();
        assertEq(bettor1.balance - bettor1BalanceBefore, 4.5 ether);
    }
}
