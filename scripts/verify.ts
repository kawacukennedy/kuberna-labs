import { run, network, ethers } from 'hardhat';
import {
  CONTRACTS,
  ContractSpec,
  DeploymentRecord,
  readDeployment,
} from './deployment-manifest';

/**
 * Verifies every contract recorded in deployments/<network>-latest.json on the
 * network's block explorer.
 *
 * Usage: npx hardhat run scripts/verify.ts --network <network>
 *
 * Requires the explorer API key for that network (ETHERSCAN_API_KEY,
 * BASESCAN_API_KEY, ARBISCAN_API_KEY, POLYGONSCAN_API_KEY, ...) depending on
 * how hardhat.config.ts configures etherscan for the network.
 */

interface VerifyOutcome {
  spec: ContractSpec;
  address: string;
  status: 'verified' | 'already-verified' | 'failed';
  detail?: string;
}

function isAlreadyVerified(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('already verified') || lower.includes('already been verified');
}

async function main() {
  const networkName = network.name;
  console.log('='.repeat(60));
  console.log('Contract Verification');
  console.log('='.repeat(60));
  console.log(`Network: ${networkName}`);
  console.log('='.repeat(60));

  const record: DeploymentRecord = readDeployment(networkName);

  // Attestation and CrossChainRouter take the owner as a constructor argument.
  // Newer deployment files record the deployer; fall back to the configured
  // signer for deployments made before that field existed.
  let owner = record.deployer;
  if (!owner) {
    const [signer] = await ethers.getSigners();
    owner = signer?.address;
    if (!owner) {
      throw new Error(
        `${networkName}-latest.json has no "deployer" field and no signer is configured, so constructor arguments cannot be reconstructed.`
      );
    }
    console.log(`\nℹ️  No deployer recorded in the deployment file; using ${owner} for constructor arguments.`);
  }

  const outcomes: VerifyOutcome[] = [];

  for (const spec of CONTRACTS) {
    const address = (record as unknown as Record<string, string>)[spec.key];
    console.log(`\nVerifying ${spec.name} at ${address}...`);

    try {
      await run('verify:verify', {
        address,
        constructorArguments: spec.args(owner),
        contract: spec.source,
      });
      console.log(`✅ ${spec.name} verified`);
      outcomes.push({ spec, address, status: 'verified' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (isAlreadyVerified(message)) {
        console.log(`✅ ${spec.name} already verified`);
        outcomes.push({ spec, address, status: 'already-verified' });
      } else {
        console.log(`⚠️  ${spec.name} verification failed: ${message}`);
        outcomes.push({ spec, address, status: 'failed', detail: message });
      }
    }
  }

  const failed = outcomes.filter((outcome) => outcome.status === 'failed');
  const succeeded = outcomes.length - failed.length;

  console.log('\n' + '='.repeat(60));
  console.log(`Verified ${succeeded}/${outcomes.length} contracts on ${networkName}.`);
  if (failed.length > 0) {
    console.log('\nNot verified:');
    for (const outcome of failed) {
      console.log(`  - ${outcome.spec.name} (${outcome.address})`);
    }
    console.log(
      '\nThe contracts are deployed either way. Add the explorer API key for this network (or wait for the explorer to index) and rerun this script.'
    );
  }
  console.log('='.repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Verification failed:');
    console.error(error);
    process.exit(1);
  });
