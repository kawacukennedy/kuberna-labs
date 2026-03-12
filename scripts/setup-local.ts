import { ethers } from 'hardhat';

/**
 * Setup script for local development
 * Deploys contracts and configures them with test data
 */

async function main() {
  const [deployer, user1, user2, user3] = await ethers.getSigners();

  console.log('='.repeat(60));
  console.log('Local Development Setup');
  console.log('='.repeat(60));
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User 1: ${user1.address}`);
  console.log(`User 2: ${user2.address}`);
  console.log(`User 3: ${user3.address}`);
  console.log('='.repeat(60));

  // Deploy contracts
  console.log('\n📝 Deploying contracts...');

  const Escrow = await ethers.getContractFactory('Escrow');
  const escrow = await Escrow.deploy();
  await escrow.waitForDeployment();
  console.log(`✅ Escrow: ${await escrow.getAddress()}`);

  const Intent = await ethers.getContractFactory('Intent');
  const intent = await Intent.deploy();
  await intent.waitForDeployment();
  console.log(`✅ Intent: ${await intent.getAddress()}`);

  const Payment = await ethers.getContractFactory('Payment');
  const payment = await Payment.deploy();
  await payment.waitForDeployment();
  console.log(`✅ Payment: ${await payment.getAddress()}`);

  // Configure test tokens
  console.log('\n⚙️  Configuring test environment...');

  // Add native token (ETH) support to Payment contract
  const nativeToken = ethers.ZeroAddress;
  await payment.addToken(
    nativeToken,
    ethers.parseEther('0.001'), // min amount
    ethers.parseEther('100') // max amount
  );
  console.log('✅ Native token (ETH) configured');

  // Fund test accounts
  console.log('\n💰 Funding test accounts...');
  const fundAmount = ethers.parseEther('10');

  await deployer.sendTransaction({
    to: user1.address,
    value: fundAmount,
  });
  console.log(`✅ Funded ${user1.address} with 10 ETH`);

  await deployer.sendTransaction({
    to: user2.address,
    value: fundAmount,
  });
  console.log(`✅ Funded ${user2.address} with 10 ETH`);

  await deployer.sendTransaction({
    to: user3.address,
    value: fundAmount,
  });
  console.log(`✅ Funded ${user3.address} with 10 ETH`);

  console.log('\n' + '='.repeat(60));
  console.log('✅ Local development environment ready!');
  console.log('='.repeat(60));
  console.log('\n📝 Contract Addresses:');
  console.log(`Escrow: ${await escrow.getAddress()}`);
  console.log(`Intent: ${await intent.getAddress()}`);
  console.log(`Payment: ${await payment.getAddress()}`);
  console.log('\n📝 Test Accounts:');
  console.log(`Deployer: ${deployer.address}`);
  console.log(`User 1: ${user1.address}`);
  console.log(`User 2: ${user2.address}`);
  console.log(`User 3: ${user3.address}`);
  console.log('\n🚀 You can now run tests or interact with contracts!');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Setup failed:');
    console.error(error);
    process.exit(1);
  });
