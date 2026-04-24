// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITournament {
    struct Config {
        address owner;
        address refereeTappAddress;
        uint256 slotPrice;
        uint256 maxSlots;
        uint16 feeRate;
        uint256 startTime;
    }

    enum State {
        Registration,
        Active,
        Finished
    }

    event TournamentStarted();
    event TournamentResolved(uint256 winnerAgentId);

    function joinTournament(uint256 agentId) external payable;

    function startTournament() external;

    function resolveTournament(uint256 winnerAgentId) external;

    function claimRewards() external;
}
