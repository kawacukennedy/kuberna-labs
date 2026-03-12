import { run } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to verify deployed contracts on block explorers
 * Usage: npx hardhat run scripts/verify.ts --network <network>
 */

interface DeploymentAddresses {
  network: string;
  chainId: number;
  escrow: string;
  intent: string;
  certificateNFT: string;
  payment: string;
  crossChainRouter: string;
  attestation: string;
  reputationNFT: string;
  subscription: string;
}

async function main() {
  const networkName = process.env.HARDHAT_NETWORK || 'localhost';

  console.log('='.repeat(60));
  console.log('Contract Verification');
  console.log('='.repeat(60));
  console.log(`Network: ${networkName}`);
  console.log('='.repeat(60));

  // Load deployment addresses
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  const latestFile = path.join(deploymentsDir, `${networkName}-latest.json`);

  if (!fs.existsSync(latestFile)) {
    console.error(`❌ No deployment found for network: ${networkName}`);
    console.error(`Expected file: ${latestFile}`);
    process.exit(1);
  }

  const deploymentAddresses: DeploymentAddresses = JSON.parse(
    fs.readFileSync(latestFile, 'utf-8')
  );

  console.log('\n📝 Verifying contracts...\n');

  // Verify Escrow Contract
  try {
    console.log('Verifying Escrow Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.escrow,
      constructorArguments: [],
    });
    console.log('✅ Escrow verified');
  } catch (error: any) {
    console.log(`⚠️  Escrow verification failed: ${error.message}`);
  }

  // Verify Intent Contract
  try {
    console.log('\nVerifying Intent Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.intent,
      constructorArguments: [],
    });
    console.log('✅ Intent verified');
  } catch (error: any) {
    console.log(`⚠️  Intent verification failed: ${error.message}`);
  }

  // Verify Certificate NFT Contract
  try {
    console.log('\nVerifying Certificate NFT Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.certificateNFT,
      constructorArguments: [],
    });
    console.log('✅ Certificate NFT verified');
  } catch (error: any) {
    console.log(`⚠️  Certificate NFT verification failed: ${error.message}`);
  }

  // Verify Payment Contract
  try {
    console.log('\nVerifying Payment Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.payment,
      constructorArguments: [],
    });
    console.log('✅ Payment verified');
  } catch (error: any) {
    console.log(`⚠️  Payment verification failed: ${error.message}`);
  }

  // Verify Cross-Chain Router Contract
  try {
    console.log('\nVerifying Cross-Chain Router Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.crossChainRouter,
      constructorArguments: [],
    });
    console.log('✅ Cross-Chain Router verified');
  } catch (error: any) {
    console.log(`⚠️  Cross-Chain Router verification failed: ${error.message}`);
  }

  // Verify Attestation Contract
  try {
    console.log('\nVerifying Attestation Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.attestation,
      constructorArguments: [],
    });
    console.log('✅ Attestation verified');
  } catch (error: any) {
    console.log(`⚠️  Attestation verification failed: ${error.message}`);
  }

  // Verify Reputation NFT Contract
  try {
    console.log('\nVerifying Reputation NFT Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.reputationNFT,
      constructorArguments: [],
    });
    console.log('✅ Reputation NFT verified');
  } catch (error: any) {
    console.log(`⚠️  Reputation NFT verification failed: ${error.message}`);
  }

  // Verify Subscription Contract
  try {
    console.log('\nVerifying Subscription Contract...');
    await run('verify:verify', {
      address: deploymentAddresses.subscription,
      constructorArguments: [],
    });
    console.log('✅ Subscription verified');
  } catch (error: any) {
    console.log(`⚠️  Subscription verification failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification process completed!');
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:');
    console.error(error);
    process.exit(1);
  });
