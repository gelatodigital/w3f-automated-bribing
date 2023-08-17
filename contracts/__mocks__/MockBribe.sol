// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IBribe} from "../interfaces/IBribe.sol";

contract MockBribe is IBribe {
    function depositBribe(
        bytes32,
        IERC20 token,
        uint256 amount,
        uint256,
        uint256
    ) external {
        token.transferFrom(msg.sender, address(this), amount);
    }

    function proposalDeadlines(bytes32) external pure returns (uint256) {
        return 2 ** 256 - 1;
    }

    function isWhitelistedToken(IERC20) external pure returns (bool) {
        return true;
    }
}
