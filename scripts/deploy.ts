import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main deployment script for Kuberna Labs Web3 Infrastructure
 * Deploys all smart contracts to the specified network
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
  deployedAt: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log('='.repeat(60));
  console.log('Kuberna Labs - Web3 Infrastructure Deployment');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`);
  console.log('='.repeat(60));

  const deploymentAddresses: DeploymentAddresses = {
    network: network.name,
    chainId: Number(network.chainId),
    escrow: '',
    intent: '',
    certificateNFT: '',
    payment: '',
    crossChainRouter: '',
    attestation: '',
    reputationNFT: '',
    subscription: '',
    deployedAt: new Date().toISOString(),
  };

  // Deploy Escrow Contract
  console.log('\n📝 Deploying Escrow Contract...');
  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  deploymentAddresses.escrow = await escrow.getAddress();
  console.log(`✅ Escrow deployed to: ${deploymentAddresses.escrow}`);

  // Deploy Intent Contract
  console.log('\n📝 Deploying Intent Contract...');
  const Intent = await ethers.getContractFactory('Intent');
  const intent = await Intent.deploy();
  await intent.waitForDeployment();
  deploymentAddresses.intent = await intent.getAddress();
  console.log(`✅ Intent deployed to: ${deploymentAddresses.intent}`);

  // Deploy Certificate NFT Contract
  console.log('\n📝 Deploying Certificate NFT Contract...');
  const CertificateNFT = await ethers.getContractFactory('CertificateNFT');
  const certificateNFT = await CertificateNFT.deploy();
  await certificateNFT.waitForDeployment();
  deploymentAddresses.certificateNFT = await certificateNFT.getAddress();
  console.log(`✅ Certificate NFT deployed to: ${deploymentAddresses.certificateNFT}`);

  // Deploy Payment Contract
  console.log('\n📝 Deploying Payment Contract...');
  const Payment = await ethers.getContractFactory('Payment');
  const payment = await Payment.deploy();
  await payment.waitForDeployment();
  deploymentAddresses.payment = await payment.getAddress();
  console.log(`✅ Payment deployed to: ${deploymentAddresses.payment}`);

  // Deploy Cross-Chain Router Contract
  console.log('\n📝 Deploying Cross-Chain Router Contract...');
  const CrossChainRouter = await ethers.getContractFactory('CrossChainRouter');
  const crossChainRouter = await CrossChainRouter.deploy();
  await crossChainRouter.waitForDeployment();
  deploymentAddresses.crossChainRouter = await crossChainRouter.getAddress();
  console.log(`✅ Cross-Chain Router deployed to: ${deploymentAddresses.crossChainRouter}`);

  // Deploy Attestation Contract
  console.log('\n📝 Deploying Attestation Contract...');
  const Attestation = await ethers.getContractFactory('Attestation');
  const attestation = await Attestation.deploy();
  await attestation.waitForDeployment();
  deploymentAddresses.attestation = await attestation.getAddress();
  console.log(`✅ Attestation deployed to: ${deploymentAddresses.attestation}`);

  // Deploy Reputation NFT Contract
  console.log('\n📝 Deploying Reputation NFT Contract...');
  const ReputationNFT = await ethers.getContractFactory('ReputationNFT');
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  deploymentAddresses.reputationNFT = await reputationNFT.getAddress();
  console.log(`✅ Reputation NFT deployed to: ${deploymentAddresses.reputationNFT}`);

  // Deploy Subscription Contract
  console.log('\n📝 Deploying Subscription Contract...');
  const Subscription = await ethers.getContractFactory('Subscription');
  const subscription = await Subscription.deploy();
  await subscription.waitForDeployment();
  deploymentAddresses.subscription = await subscription.getAddress();
  console.log(`✅ Subscription deployed to: ${deploymentAddresses.subscription}`);

  // Save deployment addresses
  console.log('\n💾 Saving deployment addresses...');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${network.name}-${Date.now()}.json`
  );
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));
  console.log(`✅ Deployment addresses saved to: ${deploymentFile}`);

  // Save latest deployment
  const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentAddresses, null, 2));
  console.log(`✅ Latest deployment saved to: ${latestFile}`);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Deployment Summary');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Escrow: ${deploymentAddresses.escrow}`);
  console.log(`Intent: ${deploymentAddresses.intent}`);
  console.log(`Certificate NFT: ${deploymentAddresses.certificateNFT}`);
  console.log(`Payment: ${deploymentAddresses.payment}`);
  console.log(`Cross-Chain Router: ${deploymentAddresses.crossChainRouter}`);
  console.log(`Attestation: ${deploymentAddresses.attestation}`);
  console.log(`Reputation NFT: ${deploymentAddresses.reputationNFT}`);
  console.log(`Subscription: ${deploymentAddresses.subscription}`);
  console.log('='.repeat(60));
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Update .env file with deployed contract addresses');
  console.log('2. Verify contracts on block explorer (if on testnet/mainnet)');
  console.log('3. Configure backend services with new addresses');
  console.log('4. Run integration tests');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
