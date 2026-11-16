import * as fs from 'fs';
import * as path from 'path';

/**
 * Single source of truth for the Kuberna contract suite: what gets deployed,
 * what constructor arguments it takes, and how its address is stored in
 * deployments/*-latest.json. Both the deploy and the verify scripts read this
 * so a newly added contract cannot be deployed-but-unverified by accident.
 */

export interface ContractSpec {
  /** Key used in deployments/*-latest.json and in the backend env vars. */
  key: string;
  /** Contract name inside the Solidity source. */
  name: string;
  /** Source path + contract name, used by hardhat-verify. */
  source: string;
  /** Constructor arguments, resolved at deploy time from the deployer address. */
  args: (deployer: string) => unknown[];
}

export interface DeploymentRecord {
  network: string;
  chainId: number;
  deployer: string;
  escrow: string;
  intent: string;
  certificateNFT: string;
  payment: string;
  subscription: string;
  reputationNFT: string;
  agentRegistry: string;
  courseNFT: string;
  workshop: string;
  dispute: string;
  treasury: string;
  feeManager: string;
  attestation: string;
  crossChainRouter: string;
  deployedAt: string;
}

export const CONTRACTS: ContractSpec[] = [
  { key: 'feeManager', name: 'KubernaFeeManager', source: 'contracts/FeeManager.sol:KubernaFeeManager', args: () => [] },
  { key: 'treasury', name: 'KubernaTreasury', source: 'contracts/Treasury.sol:KubernaTreasury', args: () => [] },
  { key: 'escrow', name: 'KubernaEscrow', source: 'contracts/Escrow.sol:KubernaEscrow', args: () => [] },
  { key: 'intent', name: 'KubernaIntent', source: 'contracts/Intent.sol:KubernaIntent', args: () => [] },
  { key: 'certificateNFT', name: 'KubernaCertificateNFT', source: 'contracts/CertificateNFT.sol:KubernaCertificateNFT', args: () => [] },
  { key: 'payment', name: 'KubernaPayment', source: 'contracts/Payment.sol:KubernaPayment', args: () => [] },
  { key: 'subscription', name: 'KubernaSubscription', source: 'contracts/Subscription.sol:KubernaSubscription', args: () => [] },
  { key: 'reputationNFT', name: 'ReputationNFT', source: 'contracts/ReputationNFT.sol:ReputationNFT', args: () => [] },
  { key: 'agentRegistry', name: 'KubernaAgentRegistry', source: 'contracts/AgentRegistry.sol:KubernaAgentRegistry', args: () => [] },
  { key: 'courseNFT', name: 'KubernaCourseNFT', source: 'contracts/CourseNFT.sol:KubernaCourseNFT', args: () => [] },
  { key: 'workshop', name: 'KubernaWorkshop', source: 'contracts/Workshop.sol:KubernaWorkshop', args: () => [] },
  { key: 'dispute', name: 'KubernaDispute', source: 'contracts/Dispute.sol:KubernaDispute', args: () => [] },
  { key: 'attestation', name: 'Attestation', source: 'contracts/Attestation.sol:Attestation', args: (owner) => [owner] },
  { key: 'crossChainRouter', name: 'CrossChainRouter', source: 'contracts/CrossChainRouter.sol:CrossChainRouter', args: (owner) => [owner] },
];

/** Chains where a mistake costs real money. Require an explicit opt-in. */
export const MAINNET_CHAIN_IDS = new Set([1, 137, 42161, 5000]);

export function deploymentsDir(): string {
  return path.join(__dirname, '..', 'deployments');
}

export function latestDeploymentPath(networkName: string): string {
  return path.join(deploymentsDir(), `${networkName}-latest.json`);
}

/**
 * Reads deployments/<network>-latest.json and rejects entries that cannot be
 * trusted: a different chain than the one being verified, or an address that
 * was never filled in.
 */
export function readDeployment(networkName: string): DeploymentRecord {
  const file = latestDeploymentPath(networkName);
  if (!fs.existsSync(file)) {
    throw new Error(`No deployment found for network "${networkName}" (expected ${file}).`);
  }

  const record = JSON.parse(fs.readFileSync(file, 'utf-8')) as DeploymentRecord;
  const zeroAddress = '0x0000000000000000000000000000000000000000';

  for (const spec of CONTRACTS) {
    const address = (record as unknown as Record<string, string>)[spec.key];
    if (!address || address === zeroAddress) {
      throw new Error(`${file} has no ${spec.key} address. Redeploy before verifying.`);
    }
  }

  return record;
}
