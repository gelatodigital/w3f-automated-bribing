// SPDX-License-Identifier: MIT
pragma solidity 0.8.21;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBribe {
    function depositBribe(
        bytes32 proposal,
        IERC20 token,
        uint256 amount,
        uint256 maxTokensPerVote,
        uint256 periods
    ) external;

    function proposalDeadlines(
        bytes32 proposal
    ) external view returns (uint256);

    function isWhitelistedToken(IERC20 token) external view returns (bool);
}
