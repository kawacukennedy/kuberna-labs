import { VirtualsManager } from '../sdk/src/virtuals.js';
import { DubstrataManager } from '../sdk/src/dubstrata.js';
import axios from 'axios';

const API_BASE = 'https://kuberna-labs.onrender.com';
const TOKEN = process.env.AUTH_TOKEN || '';
const AGENT_ID = process.env.AGENT_ID || '';

async function testVirtuals() {
  console.log('\n=== Virtuals API Test ===');
  const virtuals = new VirtualsManager({
    apiKey: process.env.VIRTUAL_API_KEY || process.env.AI_API_KEY,
  });

  const models = await virtuals.listModels();
  console.log(`Models available: ${models.length}`);

  try {
    const result = await virtuals.chat({
      model: 'anthropic-claude-opus-4-7',
      messages: [{ role: 'user', content: 'Analyze current DeFi market conditions in 1 sentence' }],
      maxTokens: 100,
    });
    console.log(`✅ Chat: ${result.choices[0].message.content}`);
    console.log(`Tokens: ${result.usage.total_tokens}`);
  } catch (err) {
    console.log(`❌ Chat failed: ${err instanceof Error ? err.message : err}`);
  }
}

async function testDubstrata() {
  console.log('\n=== Dubstrata API Test ===');
  const dubstrata = new DubstrataManager();

  let totalCost = 0;
  const queries = [
    'Analyze ETH/USDC trading pair volatility and market sentiment',
    'What is the current ETH DeFi ecosystem health score?',
    'Analyze cross-chain bridge volume trends for Ethereum L2s',
    'What is the current market sentiment on DeFi lending protocols?',
    'Analyze ETH/BTC correlation and trading patterns',
    'What are the top DeFi protocol risks currently?',
    'Analyze stablecoin liquidity across DEXes',
    'What is the ETH derivatives market telling us?',
    'Analyze MEV activity and its impact on DeFi',
    'What is the current on-chain activity trend for Ethereum?',
  ];

  for (const query of queries) {
    try {
      const result = await dubstrata.query({ query });
      totalCost += result.execution_cost || 0;
      const pa = result.structured_result?.price_action || [];
      const claims = result.structured_result?.claims || [];
      console.log(
        `  [${result.status}] $${result.remaining_balance.toFixed(3)} | ` +
          `${pa.length} prices, ${claims.length} claims | Cost: $${(result.execution_cost || 0).toFixed(4)}`
      );
    } catch (err) {
      console.log(`  ❌ Query failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }

  console.log(`\nTotal spent: $${totalCost.toFixed(4)}`);
  return totalCost;
}

async function testAgentPipeline() {
  if (!TOKEN || !AGENT_ID) {
    console.log('\n❌ Skipping agent tests: AUTH_TOKEN and AGENT_ID required');
    return;
  }
  console.log('\n=== Agent Pipeline Test ===');

  const tasks = [
    'Find arbitrage between ETH and USDC',
    'Scan for yield farming opportunities',
    'Monitor DeFi protocol health',
    'Execute cross-chain swap analysis',
    'Find best lending rates',
  ];

  for (const task of tasks) {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/agents/${AGENT_ID}/run`,
        { task },
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );
      const result = data.data || data;
      const steps = result.steps || [];
      const failed = steps.filter((s: { status: string }) => s.status === 'failed');
      const action = result.action || {};

      console.log(
        `  [${result.success ? '✅' : '❌'}] "${task.slice(0, 40)}" | ` +
          `${failed.length}/${steps.length} failed | ` +
          `Decision: ${action.type}`
      );
    } catch (err) {
      console.log(`  ❌ Run failed: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }
}

async function testAgentCreation() {
  if (!TOKEN) {
    console.log('\n❌ Skipping agent creation: AUTH_TOKEN required');
    return;
  }
  console.log('\n=== Agent Creation Test ===');

  const strategies = [
    { name: 'momentum-trader', strategy: 'momentum', framework: 'ELIZAOS' },
    { name: 'yield-optimizer', strategy: 'yield', framework: 'LANGCHAIN' },
    { name: 'risk-analyzer', strategy: 'risk', framework: 'RIG' },
    { name: 'cross-chain-swapper', strategy: 'arbitrage', framework: 'AUTOGEN' },
    { name: 'nft-flipper', strategy: 'nft', framework: 'ELIZAOS' },
  ];

  for (const strat of strategies) {
    try {
      const { data } = await axios.post(
        `${API_BASE}/api/agents`,
        {
          name: strat.name,
          description: `${strat.framework} agent using ${strat.strategy} strategy`,
          framework: strat.framework,
          model: 'gpt-4',
          config: { strategy: strat.strategy, maxPosition: 2000, stopLoss: 5 },
          tools: ['price_feed', 'intent_parser', 'dubstrata'],
          pricingModel: 'FIXED',
        },
        { headers: { Authorization: `Bearer ${TOKEN}` } }
      );
      console.log(`  ✅ Created ${strat.name}: ${data.id.slice(0, 12)}...`);
    } catch (err) {
      console.log(`  ❌ ${strat.name}: ${err instanceof Error ? err.message : 'unknown error'}`);
    }
  }
}

async function main() {
  console.log('=== Kuberna Deep Agent Test ===');
  console.log(`Started: ${new Date().toISOString()}`);

  await testVirtuals();
  const dubstrataSpent = await testDubstrata();
  await testAgentCreation();
  await testAgentPipeline();

  console.log(`\n=== Summary ===`);
  console.log(`Dubstrata spent: $${dubstrataSpent.toFixed(4)}`);
  console.log(`Completed: ${new Date().toISOString()}`);
}

main().catch(console.error);
