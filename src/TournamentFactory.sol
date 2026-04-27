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
    mapping(address => bool) public isReferee;

    event TournamentCreated(address indexed tournamentAddress, string category, uint256 id);
    event TournamentStarted(address indexed tournamentAddress, string category, uint256 id);

    constructor(address _agentNFTAddress, address _tournamentImpl) Ownable(msg.sender) {
        require(_agentNFTAddress != address(0), "Invalid agent NFT address");
        require(_tournamentImpl != address(0), "Invalid tournament implementation address");

        agentNFT = _agentNFTAddress;
        tournamentImpl = _tournamentImpl;
        isReferee[msg.sender] = true;
    }

    modifier onlyTournament() {
        require(tournaments.contains(msg.sender), "Not a tournament");
        _;
    }

    modifier onlyReferee() {
        require(isReferee[msg.sender], "Not a referee");
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

    function updateReferee(address _referee, bool _isAllowed) external onlyOwner {
        isReferee[_referee] = _isAllowed;
    }

    function setTournamentTee(address _tournament, address _tee) external onlyReferee {
        ITournament(_tournament).setTee(_tee);
    }

    function createTournament(
        string memory name,
        string memory category,
        uint256 slotPrice,
        uint256 maxSlots,
        uint16 feeRate,
        uint256 startTime
    ) external returns (address) {
        uint256 id = tournaments.length() + 1;
        ITournament.Config memory config = ITournament.Config({
            owner: msg.sender,
            tee: address(0),
            slotPrice: slotPrice,
            maxSlots: maxSlots,
            feeRate: feeRate,
            startTime: startTime,
            name: name,
            category: category,
            id: id
        });

        address instance = Clones.clone(tournamentImpl);
        Tournament(instance).initialize(config, agentNFT, address(this));
        tournaments.add(instance);

        emit TournamentCreated(instance, category, id);

        return instance;
    }

    function notifyTournamentStarted(string calldata category, uint256 id) external onlyTournament {
        emit TournamentStarted(msg.sender, category, id);
    }

    // todo refactor to better performance
    function getTournaments() external view returns (address[] memory) {
        address[] memory result = new address[](tournaments.length());
        for (uint256 i = 0; i < tournaments.length(); i++) {
            result[i] = tournaments.at(i);
        }
        return result;
    }
}
