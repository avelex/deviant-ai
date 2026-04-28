// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITournament {
    struct Config {
        address owner;
        address tee;
        uint256 slotPrice;
        uint256 maxSlots;
        uint16 feeRate;

        uint256 createdAt;
        uint256 startedAt;
        uint256 finishedAt;

        uint256 id;
        string name;
        string category;
        string liveUri;
    }

    enum State {
        Registration,
        Active,
        Finished
    }

    event TournamentStarted();
    event TournamentResolved(uint256 winnerAgentId, bool _noWinner);

    function joinTournament(uint256 agentId) external payable;

    function startTournament() external;

    function resolveTournament(uint256 _winnerAgentId, bytes32 _resultHash, bytes calldata _signature, bool _noWinner)
        external;

    function claimRewards() external;

    function setTee(address tee) external;
}
