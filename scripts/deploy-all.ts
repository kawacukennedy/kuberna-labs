import { ethers } from 'hardhat';
import * as fs from 'fs';
import * as path from 'path';

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
  agentRegistry: string;
  courseNFT: string;
  workshop: string;
  dispute: string;
  treasury: string;
  feeManager: string;
  deployedAt: string;
}

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();

  console.log('='.repeat(60));
  console.log('Kuberna Labs - Full Contract Deployment');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(
    `Balance: ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH`
  );
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
    agentRegistry: '',
    courseNFT: '',
    workshop: '',
    dispute: '',
    treasury: '',
    feeManager: '',
    deployedAt: new Date().toISOString(),
  };

  // Already deployed from first run
  deploymentAddresses.escrow = '0x360ec009ba6967F5f7C53a88FAD0452C6140493d';
  deploymentAddresses.intent = '0xB819ab0Bac2f22e8895C66fE3aDF23aa0a65145a';
  deploymentAddresses.certificateNFT = '0x5e42c329Ef517B495261f57054d5844EAabD3dbf';
  deploymentAddresses.payment = '0xFFe8A88E9E99938174B8a3C9EcA1c1462315395A';
  console.log('\n✅ Previously deployed contracts loaded');

  // Deploy Subscription
  console.log('\n📝 Deploying Subscription...');
  const Subscription = await ethers.getContractFactory('KubernaSubscription');
  const subscription = await Subscription.deploy();
  await subscription.waitForDeployment();
  deploymentAddresses.subscription = await subscription.getAddress();
  console.log(`✅ Subscription: ${deploymentAddresses.subscription}`);

  // Deploy Reputation NFT
  console.log('\n📝 Deploying Reputation NFT...');
  const ReputationNFT = await ethers.getContractFactory('ReputationNFT');
  const reputationNFT = await ReputationNFT.deploy();
  await reputationNFT.waitForDeployment();
  deploymentAddresses.reputationNFT = await reputationNFT.getAddress();
  console.log(`✅ Reputation NFT: ${deploymentAddresses.reputationNFT}`);

  // Deploy Agent Registry
  console.log('\n📝 Deploying Agent Registry...');
  const AgentRegistry = await ethers.getContractFactory('KubernaAgentRegistry');
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  deploymentAddresses.agentRegistry = await agentRegistry.getAddress();
  console.log(`✅ Agent Registry: ${deploymentAddresses.agentRegistry}`);

  // Deploy Course NFT
  console.log('\n📝 Deploying Course NFT...');
  const CourseNFT = await ethers.getContractFactory('KubernaCourseNFT');
  const courseNFT = await CourseNFT.deploy();
  await courseNFT.waitForDeployment();
  deploymentAddresses.courseNFT = await courseNFT.getAddress();
  console.log(`✅ Course NFT: ${deploymentAddresses.courseNFT}`);

  // Deploy Workshop
  console.log('\n📝 Deploying Workshop...');
  const Workshop = await ethers.getContractFactory('KubernaWorkshop');
  const workshop = await Workshop.deploy();
  await workshop.waitForDeployment();
  deploymentAddresses.workshop = await workshop.getAddress();
  console.log(`✅ Workshop: ${deploymentAddresses.workshop}`);

  // Deploy Dispute
  console.log('\n📝 Deploying Dispute...');
  const Dispute = await ethers.getContractFactory('KubernaDispute');
  const dispute = await Dispute.deploy();
  await dispute.waitForDeployment();
  deploymentAddresses.dispute = await dispute.getAddress();
  console.log(`✅ Dispute: ${deploymentAddresses.dispute}`);

  // Deploy Treasury
  console.log('\n📝 Deploying Treasury...');
  const Treasury = await ethers.getContractFactory('KubernaTreasury');
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  deploymentAddresses.treasury = await treasury.getAddress();
  console.log(`✅ Treasury: ${deploymentAddresses.treasury}`);

  // Deploy Fee Manager
  console.log('\n📝 Deploying Fee Manager...');
  const FeeManager = await ethers.getContractFactory('KubernaFeeManager');
  const feeManager = await FeeManager.deploy();
  await feeManager.waitForDeployment();
  deploymentAddresses.feeManager = await feeManager.getAddress();
  console.log(`✅ Fee Manager: ${deploymentAddresses.feeManager}`);

  // Deploy Attestation (needs owner address)
  console.log('\n📝 Deploying Attestation...');
  const Attestation = await ethers.getContractFactory('Attestation');
  const attestation = await Attestation.deploy(deployer.address);
  await attestation.waitForDeployment();
  deploymentAddresses.attestation = await attestation.getAddress();
  console.log(`✅ Attestation: ${deploymentAddresses.attestation}`);

  // Deploy CrossChainRouter (needs owner address)
  console.log('\n📝 Deploying CrossChain Router...');
  const CrossChainRouter = await ethers.getContractFactory('CrossChainRouter');
  const crossChainRouter = await CrossChainRouter.deploy(deployer.address);
  await crossChainRouter.waitForDeployment();
  deploymentAddresses.crossChainRouter = await crossChainRouter.getAddress();
  console.log(`✅ CrossChain Router: ${deploymentAddresses.crossChainRouter}`);

  // Save deployment addresses
  console.log('\n💾 Saving deployment addresses...');
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentAddresses, null, 2));

  const latestFile = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestFile, JSON.stringify(deploymentAddresses, null, 2));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('FULL DEPLOYMENT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Network: ${network.name} (Chain ID: ${network.chainId})`);
  console.log('');
  console.log('CORE CONTRACTS:');
  console.log(`Escrow:         ${deploymentAddresses.escrow}`);
  console.log(`Intent:         ${deploymentAddresses.intent}`);
  console.log(`Certificate:   ${deploymentAddresses.certificateNFT}`);
  console.log(`Payment:       ${deploymentAddresses.payment}`);
  console.log('');
  console.log('EXTENDED CONTRACTS:');
  console.log(`Subscription:   ${deploymentAddresses.subscription}`);
  console.log(`ReputationNFT:  ${deploymentAddresses.reputationNFT}`);
  console.log(`AgentRegistry:   ${deploymentAddresses.agentRegistry}`);
  console.log(`CourseNFT:      ${deploymentAddresses.courseNFT}`);
  console.log(`Workshop:       ${deploymentAddresses.workshop}`);
  console.log(`Dispute:         ${deploymentAddresses.dispute}`);
  console.log(`Treasury:       ${deploymentAddresses.treasury}`);
  console.log(`FeeManager:     ${deploymentAddresses.feeManager}`);
  console.log(`Attestation:     ${deploymentAddresses.attestation}`);
  console.log(`CrossChainRouter: ${deploymentAddresses.crossChainRouter}`);
  console.log('='.repeat(60));
  console.log('\n✅ Full deployment completed successfully!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Deployment failed:');
    console.error(error);
    process.exit(1);
  });
