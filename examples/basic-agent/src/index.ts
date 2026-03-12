import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Agent Registry ABI (simplified for example)
const AgentRegistryABI = [
  'function registerAgent(string name, string metadataURI, string[] capabilities) payable returns (uint256)',
  'function getAgent(uint256 agentId) view returns (address owner, string name, string metadataURI, bool active)',
  'function getAgentByOwner(address owner) view returns (uint256)',
  'event AgentRegistered(uint256 indexed agentId, address indexed owner, string name)',
];

async function main() {
  try {
    console.log('🚀 Kuberna Labs - Basic Agent Registration Example\n');

    // 1. Connect to blockchain
    console.log('📡 Connecting to blockchain...');
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
    
    console.log(`✅ Connected to network (Chain ID: ${(await provider.getNetwork()).chainId})`);
    console.log(`💼 Wallet address: ${wallet.address}\n`);

    // 2. Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log(`💰 Wallet balance: ${ethers.formatEther(balance)} ETH`);
    
    const stakeAmount = ethers.parseEther(process.env.STAKE_AMOUNT || '0.1');
    if (balance < stakeAmount) {
      throw new Error('Insufficient balance for stake amount + gas fees');
    }

    // 3. Load contract
    console.log('\n📄 Loading AgentRegistry contract...');
    const agentRegistry = new ethers.Contract(
      process.env.AGENT_REGISTRY_ADDRESS!,
      AgentRegistryABI,
      wallet
    );
    console.log(`✅ Contract loaded at: ${process.env.AGENT_REGISTRY_ADDRESS}\n`);

    // 4. Check if agent already registered
    console.log('🔍 Checking if agent already registered...');
    try {
      const existingAgentId = await agentRegistry.getAgentByOwner(wallet.address);
      if (existingAgentId > 0) {
        console.log(`⚠️  Agent already registered with ID: ${existingAgentId}`);
        return;
      }
    } catch (error) {
      // Agent not registered, continue
      console.log('✅ No existing agent found, proceeding with registration\n');
    }

    // 5. Prepare agent data
    const agentName = process.env.AGENT_NAME || 'MyAIAgent';
    const metadataURI = process.env.AGENT_METADATA_URL || 'https://example.com/metadata.json';
    const capabilities = (process.env.AGENT_CAPABILITIES || 'coding,writing').split(',');

    console.log('📝 Agent Details:');
    console.log(`   Name: ${agentName}`);
    console.log(`   Metadata URI: ${metadataURI}`);
    console.log(`   Capabilities: ${capabilities.join(', ')}`);
    console.log(`   Stake Amount: ${ethers.formatEther(stakeAmount)} ETH\n`);

    // 6. Register agent
    console.log('🔄 Registering agent...');
    const tx = await agentRegistry.registerAgent(
      agentName,
      metadataURI,
      capabilities,
      { value: stakeAmount }
    );

    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...\n');

    const receipt = await tx.wait();
    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);

    // 7. Get agent ID from event
    const event = receipt.logs
      .map((log: any) => {
        try {
          return agentRegistry.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'AgentRegistered');

    if (event) {
      const agentId = event.args.agentId;
      console.log(`\n🎉 Agent registered successfully!`);
      console.log(`   Agent ID: ${agentId}`);
      console.log(`   Owner: ${event.args.owner}`);
      console.log(`   Name: ${event.args.name}\n`);

      // 8. Verify registration
      console.log('🔍 Verifying registration...');
      const agent = await agentRegistry.getAgent(agentId);
      console.log('✅ Agent verified on-chain:');
      console.log(`   Owner: ${agent.owner}`);
      console.log(`   Name: ${agent.name}`);
      console.log(`   Metadata URI: ${agent.metadataURI}`);
      console.log(`   Active: ${agent.active}\n`);
    }

    console.log('✨ Example completed successfully!');
    console.log('\n📚 Next steps:');
    console.log('   - Try the Intent Bidding example');
    console.log('   - Explore the Escrow Payment flow');
    console.log('   - Read the API documentation\n');

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('\n💡 Tip: Get test ETH from https://sepoliafaucet.com/');
    } else if (error.code === 'NETWORK_ERROR') {
      console.error('\n💡 Tip: Check your RPC_URL in .env file');
    }
    
    process.exit(1);
  }
}

// Run the example
main();
