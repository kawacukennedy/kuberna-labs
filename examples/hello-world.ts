import { KubernaSDK } from '../sdk';

async function main() {
    console.log("🚀 Starting Kuberna Hello World...");

    const sdk = new KubernaSDK({ apiKey: 'demo-key' });

    const agent = await sdk.createAgent({
        name: "YieldOptimizer",
        framework: "ElizaOS"
    });

    console.log(`✅ Agent ${agent.id} is live!`);

    await sdk.deploy({
        task: "Swap 1 ETH to SOL and stake on Marinade",
        secureExecution: "TEE"
    });

    console.log("🏁 Deployment request sent successfully.");
}

main().catch(console.error);
