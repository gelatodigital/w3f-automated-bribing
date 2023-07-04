import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const name = "Mapping";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, ethers, network } = hre;
  const [deployer] = await ethers.getSigners();
  const { deploy } = deployments;

  console.log(`Deploying ${name} to ${network.name}.`);

  const { address } = await deploy(name, {
    from: deployer.address,
  });

  console.log(`Deployed ${name} at ${address}.`);
};

func.tags = [name];

export default func;
