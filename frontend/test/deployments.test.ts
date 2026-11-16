import { DEPLOYMENTS } from '@/generated/deployments';
import { CONTRACT_ADDRESSES, getContractAddress } from '@/lib/contracts';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const BASE_SEPOLIA = 84532;

const EXPECTED_CONTRACTS = [
  'escrow',
  'intent',
  'certificateNFT',
  'payment',
  'subscription',
  'reputationNFT',
  'agentRegistry',
  'courseNFT',
  'workshop',
  'dispute',
  'treasury',
  'feeManager',
  'attestation',
  'crossChainRouter',
];

describe('generated deployment record', () => {
  it('includes Base Sepolia, the chain the app runs on', () => {
    expect(DEPLOYMENTS.some((deployment) => deployment.chainId === BASE_SEPOLIA)).toBe(true);
  });

  it('never lists the same chain twice', () => {
    const chainIds = DEPLOYMENTS.map((deployment) => deployment.chainId);
    expect(new Set(chainIds).size).toBe(chainIds.length);
  });

  it.each(DEPLOYMENTS.map((deployment) => [deployment.network, deployment] as const))(
    '%s has all 14 contracts with real addresses',
    (_network, deployment) => {
      expect(Object.keys(deployment.contracts).sort()).toEqual([...EXPECTED_CONTRACTS].sort());
      for (const contract of EXPECTED_CONTRACTS) {
        const address = deployment.contracts[contract];
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
        expect(address).not.toBe(ZERO_ADDRESS);
      }
    }
  );

  it('publishes Base Sepolia even though its record predates the deployer field', () => {
    // /contracts shows Base Sepolia plus any network deployed by the current
    // script (which stamps a deployer). The older mantleSepolia/ogTestnet
    // records carry Base Sepolia addresses, so they stay hidden.
    const publishable = DEPLOYMENTS.filter(
      (deployment) => deployment.chainId === BASE_SEPOLIA || Boolean(deployment.deployer)
    );

    expect(publishable.map((deployment) => deployment.chainId)).toEqual([BASE_SEPOLIA]);
  });
});

describe('contract address resolution', () => {
  it('resolves Base Sepolia addresses from the deployment record', () => {
    const base = DEPLOYMENTS.find((deployment) => deployment.chainId === BASE_SEPOLIA)!;

    expect(getContractAddress(BASE_SEPOLIA, 'escrow')).toBe(base.contracts.escrow);
    expect(getContractAddress(BASE_SEPOLIA, 'certificate')).toBe(base.contracts.certificateNFT);
    expect(getContractAddress(BASE_SEPOLIA, 'courseNft')).toBe(base.contracts.courseNFT);
    expect(getContractAddress(BASE_SEPOLIA, 'crossChainRouter')).toBe(base.contracts.crossChainRouter);
  });

  it('does not lend Base Sepolia addresses to other chains', () => {
    for (const chainId of [1, 137, 42161, 11155111, 16602]) {
      expect(CONTRACT_ADDRESSES[chainId]).toBeUndefined();
      expect(getContractAddress(chainId, 'escrow')).toBe('');
    }
  });
});
