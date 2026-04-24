// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Tournament} from "./Tournament.sol";

contract TournamentFactory is Ownable {
    address public tournamentImpl;
    address public inftAddress;

    address[] public allTournaments;

    event TournamentCreated(address indexed tournamentAddress);

    constructor(address _inftAddress, address _tournamentImpl) Ownable(msg.sender) {
        inftAddress = _inftAddress;
        tournamentImpl = _tournamentImpl;
    }

    function setTournamentImpl(address _tournamentImpl) external onlyOwner {
        tournamentImpl = _tournamentImpl;
    }

    function setInftAddress(address _inftAddress) external onlyOwner {
        inftAddress = _inftAddress;
    }

    function createTournament(
        uint256 slotPrice,
        uint256 maxSlots,
        uint16 commissionBps,
        address refereeTappAddress,
        uint256 startTime
    ) external returns (address) {
        address clone = Clones.clone(tournamentImpl);

        Tournament.TournamentConfig memory config = Tournament.TournamentConfig({
            owner: msg.sender,
            refereeTappAddress: refereeTappAddress,
            slotPrice: slotPrice,
            maxSlots: maxSlots,
            commissionBps: commissionBps,
            startTime: startTime
        });

        Tournament(clone).initialize(config, inftAddress);
        allTournaments.push(clone);

        emit TournamentCreated(clone);

        return clone;
    }

    function getTournamentsCount() external view returns (uint256) {
        return allTournaments.length;
    }
}
