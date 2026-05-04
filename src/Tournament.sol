// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC7857Authorize} from "0g-agent-nft/interfaces/IERC7857Authorize.sol";
import {ITournament} from "./interfaces/ITournament.sol";
import {ITournamentFactory} from "./interfaces/ITournamentFactory.sol";

contract Tournament is ITournament, Initializable, ReentrancyGuardUpgradeable {
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using ECDSA for bytes32;

    ITournamentFactory public factory;
    ITournament.Config public config;
    IERC7857Authorize public agentNFTContract;
    ITournament.State public state;

    uint256 public winnerAgentId;
    bool public noWinner;
    uint256 public totalEntryFees;
    uint256 public totalBetsPool;

    EnumerableMap.UintToAddressMap private agents;
    mapping(address => mapping(uint256 => uint256)) public userBetsOnAgent;
    mapping(address => uint256) public totalUserBets;
    mapping(address => uint256) public slotsJoinedByUser;
    mapping(uint256 => uint256) public totalBetsOnAgent;
    mapping(address => bool) public hasClaimed;

    uint256 constant FEE_RATE_MAX_BPS = 10000;

    modifier onlyFactory() {
        require(msg.sender == address(factory), "Not factory");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == config.owner, "Not owner");
        _;
    }

    function initialize(ITournament.Config memory _config, address _agentNFT, address _factory) public initializer {
        __ReentrancyGuard_init();
        factory = ITournamentFactory(_factory);
        config = _config;
        agentNFTContract = IERC7857Authorize(_agentNFT);
        state = ITournament.State.Registration;
    }

    function joinTournament(uint256 _agentId) external payable {
        require(state == ITournament.State.Registration, "Not in Registration state");
        require(msg.value == config.slotPrice, "Incorrect slot price");
        require(agentNFTContract.ownerOf(_agentId) == msg.sender, "Not agent owner");
        require(!agents.contains(_agentId), "Agent already joined");
        require(agents.length() < config.maxSlots, "Tournament is full");
        require(config.tee != address(0), "Tournament not yet have TEE address");

        agents.set(_agentId, msg.sender);
        slotsJoinedByUser[msg.sender]++;
        totalEntryFees += msg.value;
    }

    function startTournament() external {
        require(state == ITournament.State.Registration, "Not in Registration state");
        require(agents.length() == config.maxSlots, "Not enough participants");
        require(block.timestamp >= config.startedAt, "Not yet time to start tournament");

        state = ITournament.State.Active;
        emit ITournament.TournamentStarted();

        factory.notifyTournamentStarted(config.category, config.id);
    }

    function placeBet(uint256 _agentId) external payable {
        require(state == ITournament.State.Registration, "Invalid state");
        require(msg.value > 0, "Bet must be > 0");
        require(agents.contains(_agentId), "Agent not in tournament");

        userBetsOnAgent[msg.sender][_agentId] += msg.value;
        totalUserBets[msg.sender] += msg.value;
        totalBetsPool += msg.value;
        totalBetsOnAgent[_agentId] += msg.value;
    }

    function resolveTournament(uint256 _winnerAgentId, bytes32 _resultHash, bytes calldata _signature, bool _noWinner)
        external
    {
        require(state == ITournament.State.Active, "Not in Active state");
        require(agents.contains(_winnerAgentId) || _noWinner, "Winner not in tournament");

        bytes32 messageHash = keccak256(abi.encodePacked(address(this), _winnerAgentId, _resultHash, _noWinner));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, _signature);

        require(signer == config.tee, "Invalid TEE signature");

        winnerAgentId = _winnerAgentId;
        noWinner = _noWinner;
        state = ITournament.State.Finished;
        config.finishedAt = block.timestamp;

        emit ITournament.TournamentResolved(_winnerAgentId, _noWinner);
    }

    function claimRewards() external nonReentrant {
        require(state == ITournament.State.Finished, "Not Finished");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 reward = 0;

        if (noWinner) {
            // Refund Logic: Bettors and Agent Owners get their full amounts back
            reward += totalUserBets[msg.sender];
            reward += slotsJoinedByUser[msg.sender] * config.slotPrice;
        } else {
            // Fee calculation (multiplication before division for precision)
            uint256 organizerFeeTotal = ((totalEntryFees + totalBetsPool) * config.feeRate) / FEE_RATE_MAX_BPS;
            uint256 netEntryFees = totalEntryFees - ((totalEntryFees * config.feeRate) / FEE_RATE_MAX_BPS);
            uint256 netBetsPool = totalBetsPool - ((totalBetsPool * config.feeRate) / FEE_RATE_MAX_BPS);

            // 1. Organizer Reward: receives total fee
            if (msg.sender == config.owner) {
                reward += organizerFeeTotal;
            }

            // 2. Winning Agent Owner Reward: receives net entry fees
            if (msg.sender == agents.get(winnerAgentId)) {
                reward += netEntryFees;
            }

            // 3. Winning Bettors Reward: proportional share of net bets pool
            uint256 betOnWinner = userBetsOnAgent[msg.sender][winnerAgentId];
            if (betOnWinner > 0 && totalBetsOnAgent[winnerAgentId] > 0) {
                reward += (betOnWinner * netBetsPool) / totalBetsOnAgent[winnerAgentId];
            }
        }

        require(reward > 0, "No rewards to claim");

        // Checks-Effects-Interactions: set claimed before transfer
        hasClaimed[msg.sender] = true;

        (bool success,) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");

        emit ITournament.RewardClaimed(msg.sender, reward);
    }

    function setTee(address _tee) external onlyFactory {
        require(state == ITournament.State.Registration, "Not in Registration state");
        require(config.tee == address(0), "Tournament already has TEE address");
        require(_tee != address(0), "Invalid TEE address");

        config.tee = _tee;
    }

    function setLiveUri(string calldata _liveUri) external onlyOwner {
        require(state == ITournament.State.Registration, "Not in Registration state");
        config.liveUri = _liveUri;
    }

    function getAgentKeys() public view returns (uint256[] memory) {
        return agents.keys();
    }

    function getOdds(uint256 _agentId) public view returns (uint256) {
        if (totalBetsOnAgent[_agentId] == 0) {
            return 0;
        }
        uint256 netBetsPool = totalBetsPool - ((totalBetsPool * config.feeRate) / FEE_RATE_MAX_BPS);
        return (netBetsPool * 1e18) / totalBetsOnAgent[_agentId];
    }
}
