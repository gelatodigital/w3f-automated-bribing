import { ethers } from "ethers";
import ky from "ky";

import {
  BALANCER_BRIBE_ADDRESS,
  AURA_BRIBE_ADDRESS,
  HIDDEN_HAND_API,
  AURA_GAUGES,
} from "./constants";

interface IProposals {
  data: [
    {
      title: string;
      proposalHash: string;
    }
  ];
}

interface IAuraGauge {
  address: string;
  label: string;
}

interface IGaugeToProposal {
  (gauge: string): Promise<string | null>;
}

/**
 * This is modular
 * One can easily add new handlers to bribe other protocols
 * The handler must accept a gauge address and convert it to a proposal hash
 */

const balancer: IGaugeToProposal = async (gauge) =>
  ethers.utils.solidityKeccak256(["address"], [gauge]);

const aura: IGaugeToProposal = async (gauge) => {
  const gauges: IAuraGauge[] = await ky.get(AURA_GAUGES).json();
  const label = gauges.find((x) => x.address === gauge)?.label;

  if (!label) return null;

  const proposals: IProposals = await ky
    .get(`${HIDDEN_HAND_API}/proposal/aura`)
    .json();

  const hash = proposals.data.find((x) => x.title === label)?.proposalHash;
  return hash || null;
};

const handlers: { [key: string]: IGaugeToProposal } = {
  [BALANCER_BRIBE_ADDRESS]: balancer,
  [AURA_BRIBE_ADDRESS]: aura,
};

export default handlers;
