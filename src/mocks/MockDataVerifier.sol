// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "0g-agent-nft/interfaces/IERC7857DataVerifier.sol";

contract MockDataVerifier is IERC7857DataVerifier {
    constructor() {}

    function verifyTransferValidity(TransferValidityProof[] calldata proofs)
        external
        returns (TransferValidityProofOutput[] memory)
    {
        return new TransferValidityProofOutput[](0);
    }
}
