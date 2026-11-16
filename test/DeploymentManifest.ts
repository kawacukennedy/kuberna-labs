import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { CONTRACTS, MAINNET_CHAIN_IDS } from '../scripts/deployment-manifest';

const repoRoot = path.join(__dirname, '..');

const EXPECTED_KEYS = [
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

describe('Deployment manifest', () => {
  it('lists every contract exactly once', () => {
    const keys = CONTRACTS.map((contract) => contract.key);

    expect(keys).to.have.length(EXPECTED_KEYS.length);
    expect(keys.slice().sort()).to.deep.equal(EXPECTED_KEYS.slice().sort());
  });

  it('points every entry at a Solidity source that exists', () => {
    for (const contract of CONTRACTS) {
      const [sourcePath, contractName] = contract.source.split(':');
      expect(contractName, `missing contract name in ${contract.source}`).to.be.a('string').and.not
        .empty;
      const absolute = path.join(repoRoot, sourcePath);
      expect(fs.existsSync(absolute), `${sourcePath} does not exist`).to.equal(true);
      expect(fs.readFileSync(absolute, 'utf8')).to.contain(
        `contract ${contractName}`,
        `${sourcePath} does not declare ${contractName}`
      );
    }
  });

  it('only gives the owner-taking contracts constructor arguments', () => {
    const owner = '0x000000000000000000000000000000000000dEaD';
    const takingArgs = CONTRACTS.filter((contract) => contract.args(owner).length > 0);

    expect(takingArgs.map((contract) => contract.key).sort()).to.deep.equal([
      'attestation',
      'crossChainRouter',
    ]);
    for (const contract of takingArgs) {
      expect(contract.args(owner)).to.deep.equal([owner]);
    }
  });

  it('treats every chain where gas costs real money as mainnet', () => {
    for (const chainId of [1, 137, 42161, 5000]) {
      expect(MAINNET_CHAIN_IDS.has(chainId), `chain ${chainId} must be mainnet-gated`).to.equal(true);
    }
    // Testnets used by CI and the app must stay deployable without the opt-in.
    for (const chainId of [11155111, 84532, 16602, 5003]) {
      expect(MAINNET_CHAIN_IDS.has(chainId), `chain ${chainId} must not be mainnet-gated`).to.equal(
        false
      );
    }
  });
});
