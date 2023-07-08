import { Briber } from "../../typechain";
import { ethers } from "ethers";

import verifyUserArgs from "./verifyUserArgs";
import gaugeToProposal from "./gaugeToProposal";

import { abi } from "../../artifacts/contracts/Briber/Briber.sol/Briber.json";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

/**
 * One plan is executed per run
 * This prevents the task from exceeding request limits
 * Two plans with one minute intervals can starve others
 * This can be avoided by randomising the executable plans
 * The tradeoff is no strict sequential ordering
 */

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider } = context;
  const { contractAddress } = verifyUserArgs(userArgs);

  const provider = multiChainProvider.default();
  const briber = new ethers.Contract(contractAddress, abi, provider) as Briber;

  const plans = await briber.getPlans();
  if (plans.length === 0) return { canExec: false, message: "No bribe plans" };

  const plan = plans.reduce((a, b) =>
    a.value.nextExec < b.value.nextExec ? a : b
  );

  const { timestamp } = await provider.getBlock("latest");

  if (plan.value.nextExec.toBigInt() > timestamp)
    return { canExec: false, message: "No bribes executable" };

  if (!gaugeToProposal[plan.value.hhBriber])
    return { canExec: false, message: "Briber not supported" };

  const proposal = await gaugeToProposal[plan.value.hhBriber](plan.value.gauge);

  if (!proposal)
    return { canExec: false, message: `Invalid proposal for: ${plan.key}` };

  const tx = await briber.populateTransaction.execBribe(plan.key, proposal);

  if (!tx.to || !tx.data)
    return { canExec: false, message: "Invalid transaction" };

  return {
    canExec: true,
    callData: [{ to: tx.to, data: tx.data }],
  };
});
