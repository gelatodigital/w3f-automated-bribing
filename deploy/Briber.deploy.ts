import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const name = "Briber";
const lib = "Mapping";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, network, ethers } = hre;
  const [deployer] = await ethers.getSigners();
  const { deploy } = deployments;

  console.log(`Deploying ${name} to ${network.name}.`);

  const mapping = await deployments.get(lib);

  const { address } = await deploy(name, {
    from: deployer.address,
    libraries: {
      Mapping: mapping.address,
    },
  });

  console.log(`Deployed ${name} at ${address}.`);
};

func.tags = [name];
func.dependencies = [lib];

export default func;
