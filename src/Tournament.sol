// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {IERC7857Authorize} from "0g-agent-nft/interfaces/IERC7857Authorize.sol";

contract Tournament is Initializable, ReentrancyGuardUpgradeable {
    using ECDSA for bytes32;

    struct TournamentConfig {
        address owner;
        address refereeTappAddress;
        uint256 slotPrice;
        uint256 maxSlots;
        uint16 commissionBps;
        uint256 startTime;
    }

    enum TournamentState {
        Created,
        Active,
        Finished,
        Canceled
    }

    TournamentConfig public config;
    TournamentState public state;
    IERC7857Authorize public inftContract;

    uint256 public winnerAgentId;
    uint256 public totalEntryFees;
    uint256 public totalBetsPool;
    uint256 public participantsCount;

    mapping(uint256 => address) public agentOwner;
    mapping(address => uint256) public bets;
    mapping(uint256 => uint256) public totalBetsOnAgent;
    mapping(address => bool) public hasClaimed;

    event TournamentStarted();
    event TournamentResolved(uint256 winnerAgentId);

    function initialize(TournamentConfig memory _config, address _inftAddress) public initializer {
        __ReentrancyGuard_init();
        config = _config;
        inftContract = IERC7857Authorize(_inftAddress);
        state = TournamentState.Created;
    }

    function joinTournament(uint256 agentId) external payable {
        require(state == TournamentState.Created, "Not in Created state");
        require(msg.value == config.slotPrice, "Incorrect slot price");
        require(inftContract.ownerOf(agentId) == msg.sender, "Not agent owner");
        require(agentOwner[agentId] == address(0), "Agent already joined");

        address[] memory authorized = inftContract.authorizedUsersOf(agentId);
        bool isAuthorized = false;
        for (uint256 i = 0; i < authorized.length; i++) {
            if (authorized[i] == config.refereeTappAddress) {
                isAuthorized = true;
                break;
            }
        }
        require(isAuthorized, "TEE Orchestrator is not authorized");

        agentOwner[agentId] = msg.sender;
        totalEntryFees += msg.value;
        participantsCount++;

        if (participantsCount >= config.maxSlots) {
            state = TournamentState.Active;
            emit TournamentStarted();
        }
    }

    function placeBet(uint256 agentId) external payable nonReentrant {
        require(state == TournamentState.Created, "Not in Created state");
        require(block.timestamp < config.startTime, "Betting window closed");
        require(msg.value > 0, "Bet must be > 0");
        require(agentOwner[agentId] != address(0), "Agent not in tournament");

        bets[msg.sender] += msg.value;
        totalBetsPool += msg.value;
        totalBetsOnAgent[agentId] += msg.value;
    }

    function resolveTournament(uint256 _winnerAgentId, string memory taskId, bytes memory signature) external {
        require(state == TournamentState.Active, "Not in Active state");
        require(agentOwner[_winnerAgentId] != address(0), "Winner not in tournament");

        bytes32 messageHash = keccak256(abi.encodePacked(address(this), _winnerAgentId, taskId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, signature);

        require(signer == config.refereeTappAddress, "Invalid TEE signature");

        winnerAgentId = _winnerAgentId;
        state = TournamentState.Finished;

        emit TournamentResolved(_winnerAgentId);
    }

    function claimRewards() external nonReentrant {
        require(state == TournamentState.Finished, "Not Finished");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 reward = 0;
        uint256 organizerFee = 0;

        // Calculate Organizer Fee
        if (msg.sender == config.owner) {
            organizerFee = ((totalEntryFees + totalBetsPool) * config.commissionBps) / 10000;
            reward += organizerFee;
        }

        uint256 netEntryFees = totalEntryFees - (totalEntryFees * config.commissionBps) / 10000;
        uint256 netBetsPool = totalBetsPool - (totalBetsPool * config.commissionBps) / 10000;

        // Agent Owner Reward (Winner takes all entry fees)
        if (msg.sender == agentOwner[winnerAgentId]) {
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
}
