// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {ITournament} from "./interfaces/ITournament.sol";
import {Tournament} from "./Tournament.sol";

contract TournamentFactory is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    address public tournamentImpl;
    address public agentNFT;
    EnumerableSet.AddressSet private tournaments;

    event TournamentCreated(address indexed tournamentAddress);
    event TournamentStarted(address indexed tournamentAddress);

    constructor(address _agentNFTAddress, address _tournamentImpl) Ownable(msg.sender) {
        require(_agentNFTAddress != address(0), "Invalid agent NFT address");
        require(_tournamentImpl != address(0), "Invalid tournament implementation address");

        agentNFT = _agentNFTAddress;
        tournamentImpl = _tournamentImpl;
    }

    modifier onlyTournament() {
        require(tournaments.contains(msg.sender), "Not a tournament");
        _;
    }

    function setTournamentImpl(address _tournamentImpl) external onlyOwner {
        require(_tournamentImpl != address(0), "Invalid tournament implementation address");
        tournamentImpl = _tournamentImpl;
    }

    function setAgentNFT(address _agentNFTAddress) external onlyOwner {
        require(_agentNFTAddress != address(0), "Invalid agent NFT address");
        agentNFT = _agentNFTAddress;
    }

    function createTournament(
        uint256 slotPrice,
        uint256 maxSlots,
        uint16 feeRate,
        address refereeTappAddress,
        uint256 startTime
    ) external returns (address) {
        address clone = Clones.clone(tournamentImpl);

        ITournament.Config memory config = ITournament.Config({
            owner: msg.sender,
            refereeTappAddress: refereeTappAddress,
            slotPrice: slotPrice,
            maxSlots: maxSlots,
            feeRate: feeRate,
            startTime: startTime
        });

        Tournament(clone).initialize(config, agentNFT);
        tournaments.add(clone);

        emit TournamentCreated(clone);

        return clone;
    }

    function notifyTournamentStarted() external onlyTournament {
        emit TournamentStarted(msg.sender);
    }
}
