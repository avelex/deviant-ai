// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {EnumerableMap} from "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {IERC7857Authorize} from "0g-agent-nft/interfaces/IERC7857Authorize.sol";
import {ITournament} from "./interfaces/ITournament.sol";
import {ITournamentFactory} from "./interfaces/ITournamentFactory.sol";

contract Tournament is ITournament, Initializable {
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
    mapping(address => uint256) public bets;
    mapping(uint256 => uint256) public totalBetsOnAgent;
    mapping(address => bool) public hasClaimed;

    uint256 constant FEE_RATE_MAX_BPS = 10000;
    int256 constant DRAWN_RESULT = -1;

    modifier onlyFactory() {
        require(msg.sender == address(factory), "Not factory");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == config.owner, "Not owner");
        _;
    }

    function initialize(ITournament.Config memory _config, address _agentNFT, address _factory) public initializer {
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
        require(state == ITournament.State.Active, "Not in Active state");
        require(block.timestamp < config.startedAt, "Betting window closed");
        require(msg.value > 0, "Bet must be > 0");
        require(agents.contains(_agentId), "Agent not in tournament");

        bets[msg.sender] += msg.value;
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

        if (noWinner) {
            // Refund Case
            reward += bets[msg.sender];
            // Refund if sender is an agent owner
            uint256[] memory agentIds = agents.keys();
            for (uint256 i = 0; i < agentIds.length; i++) {
                if (agents.get(agentIds[i]) == msg.sender && config.slotPrice > 0) {
                    reward += config.slotPrice;
                }
            }
        } else {
            // Bettor Reward (Proportional share of net bets pool)
            uint256 userBet = bets[msg.sender];
            if (userBet > 0 && totalBetsOnAgent[winnerAgentId] > 0) {
                uint256 betReward = (userBet * netBetsPool) / totalBetsOnAgent[winnerAgentId];
                reward += betReward;
            }
        }

        require(reward > 0, "No rewards to claim");

        hasClaimed[msg.sender] = true;

        (bool success,) = payable(msg.sender).call{value: reward}("");
        require(success, "Transfer failed");
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
}
