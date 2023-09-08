import { HardhatUserConfig } from "hardhat/config";
import "@gelatonetwork/web3-functions-sdk/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-deploy";
import "dotenv";

const RPC_PROVIDER = process.env.RPC_PROVIDER;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

import assert from "assert";
assert.ok(RPC_PROVIDER, "Missing RPC_PROVIDER in .env");

const config: HardhatUserConfig = {
  w3f: {
    rootDir: "./web3-functions",
    debug: false,
    networks: ["ethereum"],
  },
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: {
          optimizer: { enabled: true, runs: 999999 },
          evmVersion: "paris",
        },
      },
    ],
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    gelato: {
      default: "0x3CACa7b48D0573D793d3b0279b5F0029180E83b6",
    },
    gearMultisig: {
      default: "0x7b065Fcb0760dF0CEA8CFd144e08554F3CeA73D1",
    },
  },
  networks: {
    hardhat: {
      forking: {
        url: RPC_PROVIDER,
        blockNumber: 17649538,
      },
    },
    ethereum: {
      chainId: 1,
      url: RPC_PROVIDER,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
    },
  },
  verify: {
    etherscan: {
      apiKey: ETHERSCAN_KEY,
    },
  },
};

export default config;
