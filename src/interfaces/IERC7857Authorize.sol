// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC7857Authorize {
    function authorizeUsage(uint256 _tokenId, address _user) external;
    function revokeAuthorization(uint256 _tokenId, address _user) external;
    function authorizedUsersOf(uint256 _tokenId) external view returns (address[] memory);
    function ownerOf(uint256 tokenId) external view returns (address owner);
}