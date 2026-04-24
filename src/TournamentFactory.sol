// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin-contracts/proxy/Clones.sol";
import "./Tournament.sol";

contract TournamentFactory {
    address public immutable tournamentImplementation;
    address public immutable inftAddress;

    address[] public allTournaments;

    event TournamentCreated(address indexed tournamentAddress);

    constructor(address _inftAddress) {
        tournamentImplementation = address(new Tournament());
        inftAddress = _inftAddress;
    }

    function createTournament(
        uint256 slotPrice,
        uint256 maxSlots,
        uint8 commissionBps,
        address refereeTappAddress,
        uint256 startTime
    ) external returns (address) {
        address clone = Clones.clone(tournamentImplementation);
        
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