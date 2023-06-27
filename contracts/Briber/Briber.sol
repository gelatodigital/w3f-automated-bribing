// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {IBribe} from "../interfaces/IBribe.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {AUTOMATE} from "../constants/Automate.sol";
import {BRIBE_VAULT} from "../constants/BribeVault.sol";
import {NATIVE_TOKEN} from "../constants/Tokens.sol";

import {Plan} from "./Plan.sol";
import {Mapping} from "./Mapping.sol";
import {AutomateReady} from "../vendor/AutomateReady.sol";

contract Briber is AutomateReady {
    using Mapping for Mapping.Map;

    address public owner;
    Mapping.Map private _plans;
    mapping(IERC20 => uint256) public allocated;

    event AddedPlan(
        bytes32 indexed key,
        IBribe hhBriber,
        address gauge,
        IERC20 token,
        uint256 amount,
        uint256 interval,
        uint256 start,
        uint256 epochs
    );

    event AddedPlanAll(
        bytes32 indexed key,
        IBribe hhBriber,
        address gauge,
        IERC20 token,
        uint256 interval,
        uint256 start,
        uint256 epochs
    );

    event RemovedPlan(IBribe hhBriber, address gauge, IERC20 token);

    event PlanCancelled(IBribe hhBriber, address gauge, IERC20 token);

    event PlanCompleted(IBribe hhBriber, address gauge, IERC20 token);

    event ExecutedBribe(
        IBribe hhBriber,
        address gauge,
        bytes32 proposal,
        IERC20 token,
        uint256 amount,
        uint256 remainingEpochs
    );

    event Deposit(uint256 amount);
    event Withdraw(address to, uint256 amount);
    event WithdrawERC20(address to, IERC20 token, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Briber.onlyOwner");
        _;
    }

    constructor() AutomateReady(AUTOMATE, msg.sender) {
        owner = msg.sender;
    }

    receive() external payable {
        emit Deposit(msg.value);
    }

    // solhint-disable function-max-lines
    function addPlan(
        IBribe hhBriber,
        address gauge,
        IERC20 token,
        uint256 amount,
        uint256 interval,
        uint256 start,
        uint256 epochs,
        bool unsafe
    ) external onlyOwner {
        uint256 totalAmount = amount * epochs;

        // ensures that sufficient tokens are present to execute the plan to completion
        // this can be overridden with unsafe=true
        require(
            unsafe || totalAmount <= _getAvailable(token),
            "Briber.addPlan: amount exceeds available"
        );

        // tokens are allocated to this plan
        allocated[token] += totalAmount;

        bytes32 key = _addPlan(
            hhBriber,
            gauge,
            token,
            amount,
            interval,
            start,
            epochs
        );

        emit AddedPlan(
            key,
            hhBriber,
            gauge,
            token,
            amount,
            interval,
            start,
            epochs
        );
    }

    // this function is inherently safe as its plans bribe all unallocated tokens
    function addPlanAll(
        IBribe hhBriber,
        address gauge,
        IERC20 token,
        uint256 interval,
        uint256 start,
        uint256 epochs
    ) external onlyOwner {
        bytes32 key = _addPlan(
            hhBriber,
            gauge,
            token,
            0,
            interval,
            start,
            epochs
        );

        emit AddedPlanAll(key, hhBriber, gauge, token, interval, start, epochs);
    }

    function removePlan(bytes32 key) external onlyOwner {
        Plan storage plan = _plans.get(key);

        // free up its allocated tokens
        uint256 remainingAmount = _getAllocated(
            plan.amount,
            plan.remainingEpochs
        );
        allocated[plan.token] -= remainingAmount;

        emit RemovedPlan(plan.hhBriber, plan.gauge, plan.token);
        _plans.remove(key);
    }

    function execBribe(
        bytes32 key,
        bytes32 proposal
    ) external onlyDedicatedMsgSender {
        Plan storage plan = _plans.get(key);

        // avoid timeslip (block.timestamp is not used)
        // (nextExec - firstExec) % interval == 0
        plan.nextExec += plan.interval;
        plan.remainingEpochs--;

        bool removed = plan.amount == 0
            ? _execBribeAll(plan, proposal)
            : _execBribe(key, plan, proposal);

        // if the plan is not already removed during bribing
        // remove the plan if it is completed (no more epochs remaining)
        // no need to free up tokens since they are guaranteed to have been spent
        if (!removed && plan.remainingEpochs == 0) {
            emit PlanCompleted(plan.hhBriber, plan.gauge, plan.token);
            _plans.remove(key);
        }

        (uint256 fee, address feeToken) = _getFeeDetails();
        _transfer(fee, feeToken);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Briber.withdraw: failed to withdraw");

        emit Withdraw(to, amount);
    }

    function withdrawERC20(
        address payable to,
        IERC20 token,
        uint256 amount,
        bool unsafe
    ) external onlyOwner {
        // prevents withdrawing tokens which are in use by existing plans
        // can be overriden with unsafe=true
        require(
            unsafe || amount <= _getAvailable(token),
            "Briber.withdrawERC20: amount exceeds available"
        );

        bool sent = token.transfer(to, amount);
        require(sent, "Briber.withdrawERC20: failed to withdraw");

        emit WithdrawERC20(to, token, amount);
    }

    function getPlan(bytes32 key) external view returns (Plan memory) {
        return _plans.get(key);
    }

    function getPlans() external view returns (Plan[] memory) {
        return _plans.all();
    }

    function _addPlan(
        IBribe hhBriber,
        address gauge,
        IERC20 token,
        uint256 amount,
        uint256 interval,
        uint256 start,
        uint256 epochs
    ) internal returns (bytes32) {
        require(epochs > 0, "Briber.addPlan: must have one or more epochs");
        require(
            interval >= 60,
            "Briber.addPlan: must have at least one minute intervals"
        );

        require(gauge != address(0), "Briber.addPlan: invalid gauge");
        require(
            address(hhBriber) != address(0),
            "Briber.addPlan: invalid briber"
        );

        require(address(token) != address(0), "Briber.addPlan: invalid token");
        require(
            address(token) != NATIVE_TOKEN,
            "Briber.addPlan: native token not supported"
        );

        // solhint-disable not-rely-on-time
        if (start < block.timestamp) start = block.timestamp;

        // derive unique identifier key
        // can not use start or epochs since they are mutable
        bytes32 key = keccak256(
            abi.encodePacked(hhBriber, gauge, token, amount, interval)
        );

        _plans.set(
            key,
            Plan(hhBriber, gauge, token, amount, interval, start, epochs)
        );

        return key;
    }

    function _execBribe(
        bytes32 key,
        Plan storage plan,
        bytes32 proposal
    ) internal returns (bool removed) {
        if (plan.amount > plan.token.balanceOf(address(this))) {
            // gracefully cancel the plan if insufficient tokens are available for the bribe
            // this can only be the case if:
            //      1. an unsafe plan is added and/or
            //      2. an unsafe withdrawal is requested

            // free up remaining portion of allocated tokens
            uint256 remainingAmount = _getAllocated(
                plan.amount,
                plan.remainingEpochs
            );
            allocated[plan.token] -= remainingAmount;

            emit PlanCancelled(plan.hhBriber, plan.gauge, plan.token);
            _plans.remove(key);

            // signal that the plan is removed
            // prevents the caller from performing operations on the deleted object
            return true;
        } else {
            _bribe(plan, plan.amount, proposal);

            // free up tokens used for the bribe
            allocated[plan.token] -= plan.amount;

            return false;
        }
    }

    function _execBribeAll(
        Plan storage plan,
        bytes32 proposal
    ) internal returns (bool removed) {
        uint256 amount = _getAvailable(plan.token);

        // if there are available tokens in the contract we bribe them
        // if not we do nothing
        if (amount > 0) _bribe(plan, amount, proposal);

        return false;
    }

    function _bribe(
        Plan storage plan,
        uint256 amount,
        bytes32 proposal
    ) internal {
        plan.token.approve(BRIBE_VAULT, amount);

        plan.hhBriber.depositBribeERC20(proposal, plan.token, amount);

        emit ExecutedBribe(
            plan.hhBriber,
            plan.gauge,
            proposal,
            plan.token,
            amount,
            plan.remainingEpochs
        );
    }

    // get the contract balance excluding tokens allocated to existing plans
    function _getAvailable(IERC20 token) internal view returns (uint256) {
        uint256 balance = token.balanceOf(address(this));

        return balance > allocated[token] ? balance - allocated[token] : 0;
    }

    // get a plans allocated tokens based on its amount per epoch and remaining epochs
    function _getAllocated(
        uint256 amount,
        uint256 epochs
    ) internal pure returns (uint256) {
        return amount * epochs;
    }
}
