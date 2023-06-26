// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBribe {
    function depositBribeERC20(
        bytes32 proposal,
        IERC20 token,
        uint256 amount
    ) external;
}
