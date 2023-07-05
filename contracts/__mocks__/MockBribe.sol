// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBribe} from "../interfaces/IBribe.sol";

contract MockBribe is IBribe {
    event DepositBribe(
        bytes32 indexed proposal,
        IERC20 indexed token,
        uint256 amount,
        address indexed briber
    );

    function depositBribeERC20(
        bytes32 proposal,
        IERC20 token,
        uint256 amount
    ) external {
        token.transferFrom(msg.sender, address(this), amount);

        emit DepositBribe(proposal, token, amount, msg.sender);
    }

    function proposalDeadlines(bytes32) external pure returns (uint256) {
        return 2 ** 256 - 1;
    }

    function isWhitelistedToken(IERC20) external pure returns (bool) {
        return true;
    }
}
