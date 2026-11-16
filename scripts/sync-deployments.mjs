#!/usr/bin/env node
/**
 * Regenerates frontend/src/generated/deployments.ts from deployments/*-latest.json.
 *
 * The deployment JSON files are the only source of truth for contract addresses.
 * The site imports the generated module, so the /contracts page and any future
 * on-chain call can never disagree with what was actually deployed.
 *
 * Run: npm run sync:deployments
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const deploymentsDir = path.join(rootDir, 'deployments');
const outFile = path.join(rootDir, 'frontend', 'src', 'generated', 'deployments.ts');

const CONTRACT_KEYS = [
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

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

if (!fs.existsSync(deploymentsDir)) {
  console.error(`No deployments directory at ${deploymentsDir}`);
  process.exit(1);
}

const records = fs
  .readdirSync(deploymentsDir)
  .filter((file) => file.endsWith('-latest.json'))
  .map((file) => {
    const fullPath = path.join(deploymentsDir, file);
    try {
      return JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
    } catch (error) {
      console.error(`Skipping ${file}: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  })
  .filter((record) => record && Number.isInteger(record.chainId))
  .sort((a, b) => a.chainId - b.chainId)
  .map((record) => {
    const contracts = {};
    for (const key of CONTRACT_KEYS) {
      const address = record[key];
      if (typeof address === 'string' && ADDRESS_PATTERN.test(address) && address !== ZERO_ADDRESS) {
        contracts[key] = address;
      }
    }
    return {
      network: String(record.network),
      chainId: record.chainId,
      deployer: typeof record.deployer === 'string' ? record.deployer : null,
      deployedAt: typeof record.deployedAt === 'string' ? record.deployedAt : null,
      contracts,
    };
  });

const isEmpty = records.length === 0;

const lines = [
  '/**',
  ' * AUTO-GENERATED — do not edit by hand.',
  ' * Source: deployments/*-latest.json',
  ' * Regenerate with: npm run sync:deployments',
  ' */',
  '',
  'export interface DeploymentContracts {',
  '  [contract: string]: string;',
  '}',
  '',
  'export interface DeploymentRecord {',
  '  network: string;',
  '  chainId: number;',
  '  deployer: string | null;',
  '  deployedAt: string | null;',
  '  contracts: DeploymentContracts;',
  '}',
  '',
  `export const DEPLOYMENTS: DeploymentRecord[] = [`,
];

for (const record of records) {
  lines.push('  {');
  lines.push(`    network: ${JSON.stringify(record.network)},`);
  lines.push(`    chainId: ${record.chainId},`);
  lines.push(`    deployer: ${record.deployer ? JSON.stringify(record.deployer) : 'null'},`);
  lines.push(`    deployedAt: ${record.deployedAt ? JSON.stringify(record.deployedAt) : 'null'},`);
  lines.push('    contracts: {');
  for (const [key, address] of Object.entries(record.contracts)) {
    lines.push(`      ${key}: ${JSON.stringify(address)},`);
  }
  lines.push('    },');
  lines.push('  },');
}

lines.push('];');
lines.push('');
if (isEmpty) {
  lines.push('// No deployments/*-latest.json files were found at generation time.');
  lines.push('');
}

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, lines.join('\n'));

console.log(
  `Wrote ${path.relative(rootDir, outFile)} with ${records.length} network(s): ` +
    `${records.map((record) => `${record.network} (${record.chainId})`).join(', ') || 'none'}`
);
