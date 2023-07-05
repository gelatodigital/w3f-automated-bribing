import { Web3FunctionHardhat } from "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import { ModuleDataStruct } from "../typechain/contracts/vendor/Types.sol/IAutomate";
import { setBalance, time } from "@nomicfoundation/hardhat-network-helpers";
import { deployments, ethers, w3f, getNamedAccounts } from "hardhat";
import { GELATO_ADDRESSES } from "@gelatonetwork/automate-sdk";
import { Briber, IAutomate, IERC20, IOpsProxy } from "../typechain";
import { expect, assert } from "chai";

import {
  Web3FunctionUserArgs,
  Web3FunctionResultV2,
  Web3FunctionResultCallData,
} from "@gelatonetwork/web3-functions-sdk";

const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const HH_BRIBER_ADDRESS = "0x7Cdf753b45AB0729bcFe33DC12401E55d28308A9"; // Balancer
//const HH_BRIBER_ADDRESS = "0x642c59937A62cf7dc92F70Fd78A13cEe0aa2Bd9c"; // Aura
const GEAR_TOKEN = "0xBa3335588D9403515223F109EdC4eB7269a9Ab5D";
const BB_G_USD_GAUGE = "0x19A13793af96f534F0027b4b6a3eB699647368e7";

describe("Oracle1Balance", () => {
  let gear: IERC20;
  let briber: Briber;
  let automate: IAutomate;
  let bribeW3f: Web3FunctionHardhat;
  let userArgs: Web3FunctionUserArgs;
  let cid: string;

  before(async () => {
    await deployments.fixture();

    bribeW3f = w3f.get("bribe");
    cid = await bribeW3f.deploy();

    const { gelato: gelatoAddress } = await getNamedAccounts();
    const gelato = await ethers.getSigner(gelatoAddress);

    automate = (await ethers.getContractAt(
      "IAutomate",
      GELATO_ADDRESSES[1].automate,
      gelato
    )) as IAutomate;

    const { gearMultisig: gearMultisigAddress } = await getNamedAccounts();
    const gearMultisig = await ethers.getSigner(gearMultisigAddress);

    gear = (await ethers.getContractAt(
      "IERC20",
      GEAR_TOKEN,
      gearMultisig
    )) as IERC20;

    const { address: briberAddress } = await deployments.get("Briber");
    briber = (await ethers.getContractAt("Briber", briberAddress)) as Briber;

    const moduleData = getModuleData();
    const proxyAddress = await briber.dedicatedMsgSender();

    const { deployer: deployerAddress } = await getNamedAccounts();
    const deployer = await ethers.getSigner(deployerAddress);

    await automate
      .connect(deployer)
      .createTask(proxyAddress, "0xc0e8c0c2", moduleData, NATIVE_TOKEN);

    await setBalance(briberAddress, ethers.utils.parseEther("1"));
    await setBalance(gearMultisigAddress, ethers.utils.parseEther("2"));

    userArgs = {
      contractAddress: briberAddress,
    };
  });

  const getModuleData = () => {
    const web3FunctionArgsHex = ethers.utils.defaultAbiCoder.encode(
      ["string"],
      [briber.address.toLowerCase()]
    );

    const moduleData: ModuleDataStruct = {
      modules: [2, 4],
      args: [
        "0x",
        ethers.utils.defaultAbiCoder.encode(
          ["string", "bytes"],
          [cid, web3FunctionArgsHex]
        ),
      ],
    };

    return moduleData;
  };

  const execSyncFee = async (callData: Web3FunctionResultCallData) => {
    const moduleData = getModuleData();

    const proxyAddress = await briber.dedicatedMsgSender();
    const proxy = (await ethers.getContractAt(
      "IOpsProxy",
      proxyAddress
    )) as IOpsProxy;

    const batchExecCall = await proxy.populateTransaction.batchExecuteCall(
      [callData.to],
      [callData.data],
      [callData.value || 0]
    );

    if (!batchExecCall.to || !batchExecCall.data)
      assert.fail("Invalid transaction");

    const { deployer } = await getNamedAccounts();

    return automate.exec(
      deployer,
      batchExecCall.to,
      batchExecCall.data,
      moduleData,
      ethers.utils.parseEther("0.01"),
      NATIVE_TOKEN,
      false,
      true
    );
  };

  it("No bribe plans", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (res.canExec) assert.fail("canExec: true");
    else expect(res.message).to.equal("No bribe plans");
  });

  it("Briber.createPlan: amount exceeds available", async () => {
    await expect(
      briber.createPlan(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        ethers.utils.parseEther("100"),
        100,
        0,
        2,
        false,
        false
      )
    ).to.be.revertedWith("Briber.createPlan: amount exceeds available");
  });

  it("Briber.createPlan: CreatedPlan", async () => {
    await gear.transfer(briber.address, ethers.utils.parseEther("100000"));

    await expect(
      briber.createPlan(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        ethers.utils.parseEther("100"),
        100,
        0,
        2,
        false,
        false
      )
    ).to.emit(briber, "CreatedPlan");
  });

  it("Briber.execBribe: ExecutedBribe", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    await expect(execSyncFee(res.callData[0])).to.emit(briber, "ExecutedBribe");
  });

  it("No bribes executable", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (res.canExec) assert.fail("canExec: true");
    else expect(res.message).to.equal("No bribes executable");
  });

  it("Briber.execBribe: PlanCompleted", async () => {
    await time.increase(100);

    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    await expect(execSyncFee(res.callData[0]))
      .to.emit(briber, "ExecutedBribe")
      .to.emit(briber, "PlanCompleted");

    const plans = await briber.getPlans();
    expect(plans.length).to.equal(0);
  });

  it("Briber.createPlanAll: CreatedPlan", async () => {
    await expect(
      briber.createPlanAll(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        100,
        0,
        2,
        true
      )
    ).to.emit(briber, "CreatedPlan");
  });

  it("Briber.execBribe: ExecutedBribe", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    const balanceBefore = await gear.balanceOf(briber.address);
    await expect(balanceBefore).to.equal(ethers.utils.parseEther("99800"));

    await expect(execSyncFee(res.callData[0])).to.emit(briber, "ExecutedBribe");

    const balanceAfter = await gear.balanceOf(briber.address);
    await expect(balanceAfter).to.equal(0);
  });

  it("Briber.createPlan: CreatedPlan", async () => {
    await gear.transfer(briber.address, ethers.utils.parseEther("100000"));

    await expect(
      briber.createPlan(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        ethers.utils.parseEther("50000"),
        100,
        0,
        2,
        false,
        false
      )
    ).to.emit(briber, "CreatedPlan");
  });

  it("Briber.createPlan: amount exceeds available", async () => {
    await expect(
      briber.createPlan(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        ethers.utils.parseEther("1"),
        100,
        0,
        1,
        false,
        false
      )
    ).to.be.revertedWith("Briber.createPlan: amount exceeds available");
  });

  it("Briber.removePlan: RemovedPlan", async () => {
    const plans = await briber.getPlans();
    const plan = plans.find((x) => x.amount.toBigInt() !== 0n);

    if (!plan) assert.fail("Plan not found");

    const key = ethers.utils.solidityKeccak256(
      [
        "uint8",
        "address",
        "address",
        "address",
        "uint256",
        "uint256",
        "uint256",
        "bool",
      ],
      [
        plan.style,
        plan.hhBriber,
        plan.gauge,
        plan.token,
        plan.amount,
        plan.interval,
        plan.createdAt,
        plan.canSkip,
      ]
    );

    await expect(briber.removePlan(key)).to.emit(briber, "RemovedPlan");
  });

  it("Briber.createPlan: CreatedPlan", async () => {
    await expect(
      briber.createPlan(
        HH_BRIBER_ADDRESS,
        BB_G_USD_GAUGE,
        GEAR_TOKEN,
        ethers.utils.parseEther("100000"),
        100,
        0,
        1,
        false,
        false
      )
    ).to.emit(briber, "CreatedPlan");
  });

  it("Briber.execBribe: PlanCompleted", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    await expect(execSyncFee(res.callData[0]))
      .to.emit(briber, "ExecutedBribe")
      .to.emit(briber, "PlanCompleted");

    const balance = await gear.balanceOf(briber.address);
    expect(balance).to.equal(0);
  });

  it("No bribes executable", async () => {
    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (res.canExec) assert.fail("canExec: true");
    else expect(res.message).to.equal("No bribes executable");
  });

  it("Briber.execBribe: PlanCompleted", async () => {
    await time.increase(100);

    const exec = await bribeW3f.run({ userArgs });
    const res = exec.result as Web3FunctionResultV2;

    if (!res.canExec) assert.fail(res.message);

    await expect(execSyncFee(res.callData[0])).to.emit(briber, "PlanCompleted");

    const plans = await briber.getPlans();
    expect(plans.length).to.equal(0);
  });
});
