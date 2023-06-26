import { Briber } from "../../typechain";
import { ethers } from "ethers";

import verifyUserArgs from "./verifyUserArgs";
import gaugeToProposal from "./gaugeToProposal";

import briberAbi from "./abi/briber.json";

import {
  Web3Function,
  Web3FunctionContext,
} from "@gelatonetwork/web3-functions-sdk";

/**
 * One plan is executed per run
 * This prevents the task from exceeding request limits
 * This however allows plans to starve each other
 * To avoid this we first shuffle the array
 */

const shuffled = (arr: any[]) => arr.sort(() => 0.5 - Math.random());

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { userArgs, multiChainProvider } = context;
  const { contractAddress } = verifyUserArgs(userArgs);

  const provider = multiChainProvider.default();
  const briber = new ethers.Contract(
    contractAddress,
    briberAbi,
    provider
  ) as Briber;

  const plans = await briber.getPlans();
  const { timestamp } = await provider.getBlock("latest");

  for (const plan of shuffled(plans)) {
    // filter out plans which are on cooldown (executed recently)
    if (plan.nextExec.toBigInt() > timestamp) continue;

    // filter out plans with unsupported gauge to proposal translation
    if (gaugeToProposal[plan.hhBriber] === undefined) continue;

    const key = ethers.utils.solidityKeccak256(
      ["address", "address", "address"],
      [plan.hhBriber, plan.gauge, plan.token]
    );

    const proposal = await gaugeToProposal[plan.hhBriber](plan.gauge);
    const tx = await briber.populateTransaction.execBribe(key, proposal);

    if (!tx.to || !tx.data)
      return { canExec: false, message: "Invalid transaction" };

    return {
      canExec: true,
      callData: [{ to: tx.to, data: tx.data }],
    };
  }

  return {
    canExec: false,
    message: "No bribes to execute",
  };
});
