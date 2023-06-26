// web3-functions/bribe/index.ts
import { ethers as ethers3 } from "ethers";

// web3-functions/bribe/verifyUserArgs.ts
import { ethers } from "ethers";
var verifyUserArgs = (args) => {
  const contractAddress = args.contractAddress;
  if (!ethers.utils.isAddress(contractAddress))
    throw "verifyUserArgs: Briber invalid address";
  return { contractAddress };
};
var verifyUserArgs_default = verifyUserArgs;

// web3-functions/bribe/gaugeToProposal.ts
import { ethers as ethers2 } from "ethers";
import ky from "ky";

// web3-functions/bribe/constants.ts
var BALANCER_BRIBE_ADDRESS = "0x7Cdf753b45AB0729bcFe33DC12401E55d28308A9";
var AURA_BRIBE_ADDRESS = "0x642c59937A62cf7dc92F70Fd78A13cEe0aa2Bd9c";
var HIDDEN_HAND_API = "https://api.hiddenhand.finance";
var AURA_GAUGES = "https://raw.githubusercontent.com/aurafinance/aura-contracts/main/tasks/snapshot/gauge_choices.json";

// web3-functions/bribe/gaugeToProposal.ts
var balancer = async (gauge) => ethers2.utils.solidityKeccak256(["address"], [gauge]);
var aura = async (gauge) => {
  const gauges = await ky.get(AURA_GAUGES).json();
  const label = gauges.find((x) => x.address === gauge).label;
  const proposals = await ky.get(`${HIDDEN_HAND_API}/proposal/aura`).json();
  return proposals.data.find((x) => x.title === label).proposalHash;
};
var gaugeToProposal_default = {
  [BALANCER_BRIBE_ADDRESS]: balancer,
  [AURA_BRIBE_ADDRESS]: aura
};

// web3-functions/bribe/abi/briber.json
var briber_default = [
  {
    inputs: [],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "key",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "interval",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "epochs",
        type: "uint256"
      }
    ],
    name: "AddedPlan",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "bytes32",
        name: "key",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "interval",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "epochs",
        type: "uint256"
      }
    ],
    name: "AddedPlanAll",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Deposit",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "bytes32",
        name: "proposal",
        type: "bytes32"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "remainingEpochs",
        type: "uint256"
      }
    ],
    name: "ExecutedBribe",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      }
    ],
    name: "PlanCancelled",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      }
    ],
    name: "PlanCompleted",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        indexed: false,
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      }
    ],
    name: "RemovedPlan",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "Withdraw",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "to",
        type: "address"
      },
      {
        indexed: false,
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "WithdrawERC20",
    type: "event"
  },
  {
    inputs: [
      {
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "interval",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "epochs",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "unsafe",
        type: "bool"
      }
    ],
    name: "addPlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "contract IBribe",
        name: "hhBriber",
        type: "address"
      },
      {
        internalType: "address",
        name: "gauge",
        type: "address"
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "interval",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "start",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "epochs",
        type: "uint256"
      }
    ],
    name: "addPlanAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "contract IERC20",
        name: "",
        type: "address"
      }
    ],
    name: "allocated",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "automate",
    outputs: [
      {
        internalType: "contract IAutomate",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "dedicatedMsgSender",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32"
      },
      {
        internalType: "bytes32",
        name: "proposal",
        type: "bytes32"
      }
    ],
    name: "execBribe",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32"
      }
    ],
    name: "getPlan",
    outputs: [
      {
        components: [
          {
            internalType: "contract IBribe",
            name: "hhBriber",
            type: "address"
          },
          {
            internalType: "address",
            name: "gauge",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "token",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "interval",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "nextExec",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "remainingEpochs",
            type: "uint256"
          }
        ],
        internalType: "struct Plan",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getPlans",
    outputs: [
      {
        components: [
          {
            internalType: "contract IBribe",
            name: "hhBriber",
            type: "address"
          },
          {
            internalType: "address",
            name: "gauge",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "token",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "interval",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "nextExec",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "remainingEpochs",
            type: "uint256"
          }
        ],
        internalType: "struct Plan[]",
        name: "",
        type: "tuple[]"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "key",
        type: "bytes32"
      }
    ],
    name: "removePlan",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "to",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address payable",
        name: "to",
        type: "address"
      },
      {
        internalType: "contract IERC20",
        name: "token",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      },
      {
        internalType: "bool",
        name: "unsafe",
        type: "bool"
      }
    ],
    name: "withdrawERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    stateMutability: "payable",
    type: "receive"
  }
];

// web3-functions/bribe/index.ts
import {
  Web3Function
} from "@gelatonetwork/web3-functions-sdk";
var shuffled = (arr) => arr.sort(() => 0.5 - Math.random());
Web3Function.onRun(async (context) => {
  const { userArgs, multiChainProvider } = context;
  const { contractAddress } = verifyUserArgs_default(userArgs);
  const provider = multiChainProvider.default();
  const briber = new ethers3.Contract(contractAddress, briber_default, provider);
  const plans = await briber.getPlans();
  const { timestamp } = await provider.getBlock("latest");
  for (const plan of shuffled(plans)) {
    if (plan.nextExec.toBigInt() > timestamp)
      continue;
    if (gaugeToProposal_default[plan.hhBriber] === void 0)
      continue;
    const key = ethers3.utils.solidityKeccak256(
      ["address", "address", "address"],
      [plan.hhBriber, plan.gauge, plan.token]
    );
    const proposal = await gaugeToProposal_default[plan.hhBriber](plan.gauge);
    const tx = await briber.populateTransaction.execBribe(key, proposal);
    if (!tx.to || !tx.data)
      return { canExec: false, message: "Invalid transaction" };
    return {
      canExec: true,
      callData: [{ to: tx.to, data: tx.data }]
    };
  }
  return {
    canExec: false,
    message: "No bribes to execute"
  };
});
