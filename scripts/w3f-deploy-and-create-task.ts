import { AutomateSDK } from "@gelatonetwork/automate-sdk";
import { deployments, ethers, w3f } from "hardhat";

const main = async () => {
  // deploy W3F to IPFS
  console.log("Deploying W3F to IPFS.");

  const bribeW3f = w3f.get("bribe");
  const cid = await bribeW3f.deploy();

  console.log(`Deployed W3F hash ${cid}.`);

  // create W3F task
  console.log("Creating W3F task.");

  const briber = await deployments.get("Briber");
  const [deployer] = await ethers.getSigners();
  const chainId = await deployer.getChainId();

  const automate = new AutomateSDK(chainId, deployer);

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "Automated Bribing",
    web3FunctionHash: cid,
    web3FunctionArgs: {
      contractAddress: briber.address,
    },
    useTreasury: false,
  });

  await tx.wait();
  console.log(
    `Created W3F task: https://beta.app.gelato.network/task/${taskId}?chainId=${chainId}`
  );
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
