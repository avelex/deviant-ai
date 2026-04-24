// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC7857Authorize} from "0g-agent-nft/interfaces/IERC7857Authorize.sol";
import {ITournament} from "./interfaces/ITournament.sol";
import {ITournamentFactory} from "./interfaces/ITournamentFactory.sol";

contract Tournament is ITournament {
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using ECDSA for bytes32;

    ITournamentFactory public factory;
    ITournament.Config public config;
    IERC7857Authorize public agentNFTContract;
    ITournament.State public state;

    uint256 public winnerAgentId;
    uint256 public totalEntryFees;
    uint256 public totalBetsPool;
    uint256 public participantsCount;

    EnumerableMap.UintToAddressMap private agents;
    mapping(address => uint256) public bets;
    mapping(uint256 => uint256) public totalBetsOnAgent;
    mapping(address => bool) public hasClaimed;

    uint256 constant FEE_RATE_MAX_BPS = 10000;

    function initialize(ITournament.Config memory _config, address _agentNFTContractAddress) public {
        factory = ITournamentFactory(msg.sender);
        config = _config;
        agentNFTContract = IERC7857Authorize(_agentNFTContractAddress);
        state = ITournament.State.Registration;
    }

    function joinTournament(uint256 agentId) external payable {
        require(state == ITournament.State.Registration, "Not in Registration state");
        require(msg.value == config.slotPrice, "Incorrect slot price");
        require(agentNFTContract.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(!agents.contains(agentId), "Agent already joined");
        require(participantsCount < config.maxSlots, "Tournament is full");

        address[] memory authorized = agentNFTContract.authorizedUsersOf(agentId);
        bool isAuthorized = false;
        for (uint256 i = 0; i < authorized.length; i++) {
            if (authorized[i] == config.refereeTappAddress) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "TEE Orchestrator is not authorized");

        agents.set(agentId, msg.sender);
        totalEntryFees += msg.value;
        participantsCount++;
    }

    function startTournament() external {
        require(state == ITournament.State.Registration, "Not in Registration state");
        require(participantsCount == config.maxSlots, "Not enough participants");
        require(block.timestamp >= config.startTime, "Not yet time to start tournament");

        state = ITournament.State.Active;
        emit TournamentStarted();

        factory.notifyTournamentStarted();
    }

    function placeBet(uint256 agentId) external payable {
        require(state == ITournament.State.Active, "Not in Active state");
        require(block.timestamp < config.startTime, "Betting window closed");
        require(msg.value > 0, "Bet must be > 0");
        require(agents.contains(agentId), "Agent not in tournament");

        bets[msg.sender] += msg.value;
        totalBetsPool += msg.value;
        totalBetsOnAgent[agentId] += msg.value;
    }

    function resolveTournament(uint256 _winnerAgentId) external {
        require(state == ITournament.State.Active, "Not in Active state");
        require(agents.contains(_winnerAgentId), "Winner not in tournament");

        // bytes32 messageHash = keccak256(abi.encodePacked(address(this), _winnerAgentId, taskId));
        // bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        // address signer = ECDSA.recover(ethSignedMessageHash, signature);

        // require(signer == config.refereeTappAddress, "Invalid TEE signature");

        winnerAgentId = _winnerAgentId;
        state = ITournament.State.Finished;

        emit ITournament.TournamentResolved(_winnerAgentId);
    }

    function claimRewards() external {
        require(state == ITournament.State.Finished, "Not Finished");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 reward = 0;
        uint256 organizerFee = 0;

        // Calculate Organizer Fee
        if (msg.sender == config.owner) {
            organizerFee = ((totalEntryFees + totalBetsPool) * config.feeRate) / FEE_RATE_MAX_BPS;
            reward += organizerFee;
        }

        uint256 netEntryFees = totalEntryFees - (totalEntryFees * config.feeRate) / FEE_RATE_MAX_BPS;
        uint256 netBetsPool = totalBetsPool - (totalBetsPool * config.feeRate) / FEE_RATE_MAX_BPS;

        // Agent Owner Reward (Winner takes all entry fees)
        if (msg.sender == config.owner) {
            reward += netEntryFees;
        }

        // Bettor Reward (Proportional share of net bets pool)
        uint256 userBet = bets[msg.sender];
        if (userBet > 0 && totalBetsOnAgent[winnerAgentId] > 0) {
            uint256 betReward = (userBet * netBetsPool) / totalBetsOnAgent[winnerAgentId];
            reward += betReward;
        }

        require(reward > 0, "No rewards to claim");

        hasClaimed[msg.sender] = true;
        (bool success,) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");
    }

    function getAgentKeys() public view returns (uint256[] memory) {
        return agents.keys();
    }
}
