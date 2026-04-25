// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ITournamentFactory {
    function notifyTournamentStarted(string calldata category, uint256 id) external;
}
