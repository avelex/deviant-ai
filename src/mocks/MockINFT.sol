// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockINFT {
    mapping(uint256 => address) public owners;
    mapping(uint256 => address[]) public authorized;

    function mint(uint256 tokenId, address to) external {
        owners[tokenId] = to;
    }

    function authorize(uint256 tokenId, address user) external {
        authorized[tokenId].push(user);
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return owners[tokenId];
    }

    function authorizedUsersOf(uint256 tokenId) external view returns (address[] memory) {
        return authorized[tokenId];
    }
}