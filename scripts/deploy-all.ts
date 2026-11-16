import { ethers, network } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';
import {
  CONTRACTS,
  MAINNET_CHAIN_IDS,
  DeploymentRecord,
  deploymentsDir,
} from './deployment-manifest';

/**
 * Deploys the full Kuberna contract suite to the selected Hardhat network.
 *
 * Usage: npx hardhat run scripts/deploy-all.ts --network <network>
 *
 * Every address in the written deployment file comes from a deployment that
 * happened in this run. Nothing is reused between chains: an address is only
 * valid on the chain it was deployed on.
 */

async function main() {
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      'No deployer account available. Set PRIVATE_KEY (or the network-specific <NETWORK>_PRIVATE_KEY) before deploying.'
    );
  }

  const chain = await ethers.provider.getNetwork();
  const chainId = Number(chain.chainId);
  const expectedChainId = network.config.chainId;

  if (expectedChainId && chainId !== expectedChainId) {
    throw new Error(
      `RPC returned chain ${chainId} but network "${network.name}" is configured for ${expectedChainId}. Refusing to deploy.`
    );
  }

  if (MAINNET_CHAIN_IDS.has(chainId) && process.env.ALLOW_MAINNET_DEPLOY !== 'true') {
    throw new Error(
      `Chain ${chainId} is a mainnet. Set ALLOW_MAINNET_DEPLOY=true to deploy there on purpose.`
    );
  }

  const balance = await ethers.provider.getBalance(deployer.address);

  console.log('='.repeat(60));
  console.log('Kuberna Labs - Full Contract Deployment');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(balance)} native`);
  console.log('='.repeat(60));

  if (balance === 0n) {
    throw new Error(
      `Deployer ${deployer.address} has no native balance on ${network.name}. Fund it (gas only) and retry.`
    );
  }

  const addresses: Record<string, string> = {};

  for (const spec of CONTRACTS) {
    console.log(`\n📝 Deploying ${spec.name}...`);
    const factory = await ethers.getContractFactory(spec.name);
    const contract = await factory.deploy(...spec.args(deployer.address));
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    const code = await ethers.provider.getCode(address);
    if (code === '0x') {
      throw new Error(`${spec.name} has no code at ${address} after deployment. Aborting.`);
    }

    addresses[spec.key] = address;
    console.log(`✅ ${spec.name}: ${address}`);
  }

  const record = {
    network: network.name,
    chainId,
    deployer: deployer.address,
    escrow: addresses.escrow,
    intent: addresses.intent,
    certificateNFT: addresses.certificateNFT,
    payment: addresses.payment,
    subscription: addresses.subscription,
    reputationNFT: addresses.reputationNFT,
    agentRegistry: addresses.agentRegistry,
    courseNFT: addresses.courseNFT,
    workshop: addresses.workshop,
    dispute: addresses.dispute,
    treasury: addresses.treasury,
    feeManager: addresses.feeManager,
    attestation: addresses.attestation,
    crossChainRouter: addresses.crossChainRouter,
    deployedAt: new Date().toISOString(),
  } satisfies DeploymentRecord;

  const missing = CONTRACTS.filter((spec) => !addresses[spec.key]);
  if (missing.length > 0) {
    throw new Error(`Missing addresses for: ${missing.map((m) => m.name).join(', ')}`);
  }

  console.log('\n💾 Saving deployment addresses...');
  const dir = deploymentsDir();
  fs.mkdirSync(dir, { recursive: true });

  const body = `${JSON.stringify(record, null, 2)}\n`;
  const timestamped = path.join(dir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(timestamped, body);
  fs.writeFileSync(path.join(dir, `${network.name}-latest.json`), body);
  console.log(`Wrote ${path.relative(process.cwd(), timestamped)}`);
  console.log(`Wrote deployments/${network.name}-latest.json`);

  console.log('\n' + '='.repeat(60));
  console.log(`DEPLOYED ON ${network.name} (chain ${chainId})`);
  console.log('='.repeat(60));
  for (const spec of CONTRACTS) {
    console.log(`${spec.key.padEnd(18)} ${addresses[spec.key]}`);
  }
  console.log('='.repeat(60));
  console.log(`\nNext: npx hardhat run scripts/verify.ts --network ${network.name}`);
  console.log('Then: update the *_CONTRACT_ADDRESS env vars with these values.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
