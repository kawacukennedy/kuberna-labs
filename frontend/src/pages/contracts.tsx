import React from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Seo } from '@/components/seo/Seo';
import { Layout } from '@/components/layout/Layout';
import { DEPLOYMENTS, DeploymentRecord } from '@/generated/deployments';
import { CHAIN_IDS, getChainById } from '@/lib/chains';

const CONTRACT_LABELS: Record<string, string> = {
  escrow: 'Escrow',
  intent: 'Intent',
  certificateNFT: 'Certificate NFT',
  payment: 'Payment',
  subscription: 'Subscription',
  reputationNFT: 'Reputation NFT',
  agentRegistry: 'Agent Registry',
  courseNFT: 'Course NFT',
  workshop: 'Workshop',
  dispute: 'Dispute',
  treasury: 'Treasury',
  feeManager: 'Fee Manager',
  attestation: 'Attestation',
  crossChainRouter: 'Cross-Chain Router',
};

const CONTRACT_ORDER = Object.keys(CONTRACT_LABELS);

/**
 * Block explorer for a chain. Kept local (rather than reusing
 * getExplorerAddressUrl) so an unknown chain renders no link at all instead of
 * a link to the wrong explorer.
 */
const EXPLORERS: Record<number, string> = {
  [CHAIN_IDS.ETHEREUM_MAINNET]: 'https://etherscan.io',
  [CHAIN_IDS.ETHEREUM_SEPOLIA]: 'https://sepolia.etherscan.io',
  [CHAIN_IDS.POLYGON]: 'https://polygonscan.com',
  [CHAIN_IDS.ARBITRUM]: 'https://arbiscan.io',
  [CHAIN_IDS.BASE_SEPOLIA]: 'https://sepolia.basescan.org',
  [CHAIN_IDS.OG_TESTNET]: 'https://scan-testnet.0g.ai',
};

function contractEntries(record: DeploymentRecord): Array<[string, string]> {
  return CONTRACT_ORDER.filter((key) => record.contracts[key]).map((key) => [key, record.contracts[key]]);
}

function DeploymentCard({ record }: { record: DeploymentRecord }) {
  const explorer = EXPLORERS[record.chainId];
  const chainName = getChainById(record.chainId)?.name ?? record.network;
  const entries = contractEntries(record);

  return (
    <section className="rounded-2xl border border-outline/20 bg-surface-container-low p-6 md:p-8">
      <header className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-on-surface">{chainName}</h2>
          <p className="mt-1 text-xs text-on-surface-variant">
            Chain ID {record.chainId}
            {record.deployedAt ? ` · deployed ${new Date(record.deployedAt).toISOString().slice(0, 10)}` : ''}
          </p>
        </div>
        <span className="rounded-full bg-surface-container px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          {entries.length} contracts
        </span>
      </header>

      <ul className="divide-y divide-outline/10">
        {entries.map(([key, address]) => (
          <li key={key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <span className="text-sm font-medium text-on-surface">{CONTRACT_LABELS[key] ?? key}</span>
            {explorer ? (
              <a
                href={`${explorer}/address/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 break-all font-mono text-xs text-primary hover:underline"
              >
                {address}
                <ExternalLink size={12} aria-hidden />
              </a>
            ) : (
              <span className="break-all font-mono text-xs text-on-surface-variant">{address}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ContractsPage() {
  // Base Sepolia is the chain the product runs on today, so it is always shown.
  // Other networks appear only once a deployment was recorded by the current
  // scripts, which stamp every record with the deployer address; older records
  // cannot be traced to a real deployment and are deliberately not published.
  const featured = DEPLOYMENTS.filter((record) => record.chainId === CHAIN_IDS.BASE_SEPOLIA);
  const others = DEPLOYMENTS.filter(
    (record) => record.chainId !== CHAIN_IDS.BASE_SEPOLIA && Boolean(record.deployer)
  );
  const deployments = [...featured, ...others];

  return (
    <Layout>
      <Seo
        title="Contracts"
        description="Every Kuberna Labs smart contract address, with a direct block explorer link so you can verify the deployed code yourself."
        path="/contracts"
      />

      <section className="relative overflow-hidden bg-surface px-6 pb-12 pt-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-fixed/10 via-transparent to-transparent" />
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline/20 bg-surface-container px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
            <ShieldCheck size={14} aria-hidden /> Verifiable on-chain
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-on-surface md:text-5xl">
            Deployed <span className="text-primary">Contracts</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-on-surface-variant">
            Every address below is the contract the application calls, generated from the repository&apos;s
            deployment records. Follow any link to read the verified source on the explorer.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold text-secondary">
            <CheckCircle2 size={14} aria-hidden /> Built on Base
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-6 pb-24">
        {deployments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-outline/30 p-10 text-center">
            <h2 className="text-lg font-semibold text-on-surface">Deployment addresses are not published yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
              The contracts are deployed, but this build has no deployment record to show. Check back shortly, or
              deploy and regenerate the registry.
            </p>
          </div>
        ) : (
          deployments.map((record) => <DeploymentCard key={record.chainId} record={record} />)
        )}

        <div className="rounded-2xl border border-outline/20 bg-surface-container-low p-6 text-sm text-on-surface-variant">
          <h2 className="mb-2 font-semibold text-on-surface">How to check this yourself</h2>
          <p>
            Each link opens the contract on the chain&apos;s explorer. Compare the address here with the one in{' '}
            <a
              href="https://github.com/kawacukennedy/kuberna-labs/tree/main/deployments"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              deployments/
            </a>{' '}
            in the repository, and read the verified source on the explorer. If the two disagree, the explorer is
            right — treat it as a bug and report it.
          </p>
        </div>

        <p className="text-center text-xs text-on-surface-variant">
          Building on Kuberna?{' '}
          <Link href="/docs" className="text-primary hover:underline">
            Read the developer docs
          </Link>{' '}
          or{' '}
          <a
            href="https://www.npmjs.com/package/@kuberna/sdk"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            install the SDK
          </a>
          .
        </p>
      </div>
    </Layout>
  );
}
