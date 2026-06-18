import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { FileText, Code, BookOpen, Zap, ChevronRight, Copy, Check, Terminal, Shield, Link2 } from 'lucide-react';
import { useState } from 'react';

const NPM_PACKAGE = '@kuberna/sdk';

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group">
      <pre className="bg-surface-dim rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute top-2 right-2 p-2 rounded-lg bg-surface/80 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
      </button>
    </div>
  );
}

export default function DocsPage() {
  return (
    <Layout>
      <Head><title>Documentation — Kuberna Labs</title></Head>
      <div className="flex min-h-screen">
        <aside className="w-64 bg-surface border-r border-outline/10 fixed h-screen overflow-y-auto hidden lg:block">
          <div className="p-6">
            <h2 className="text-lg font-bold mb-6">Documentation</h2>
            <nav className="space-y-1">
              <Link href="/docs" className="sidebar-item active">
                <BookOpen size={18} /> Getting Started
              </Link>
              <Link href="/docs#installation" className="sidebar-item">
                <Terminal size={18} /> Installation
              </Link>
              <Link href="/docs#quickstart" className="sidebar-item">
                <Zap size={18} /> Quick Start
              </Link>
              <Link href="/docs#intents" className="sidebar-item">
                <Link2 size={18} /> Cross-Chain Intents
              </Link>
              <Link href="/docs#payments" className="sidebar-item">
                <Zap size={18} /> Payments
              </Link>
              <Link href="/docs#tee" className="sidebar-item">
                <Shield size={18} /> TEE Deployment
              </Link>
              <Link href="/docs#certificates" className="sidebar-item">
                <FileText size={18} /> Certificates
              </Link>
              <Link href="/docs#errors" className="sidebar-item">
                <Code size={18} /> Error Handling
              </Link>
            </nav>
          </div>
        </aside>

        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-on-surface-variant text-lg">Everything you need to build with Kuberna Labs.</p>
          </div>

          <section className="mb-12" id="installation">
            <div className="bg-surface-dim rounded-xl overflow-hidden">
              <div className="flex gap-2 px-4 py-3 bg-surface border-b border-outline/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="p-6">
                <pre className="font-mono text-sm">
                  <code>npm install {NPM_PACKAGE}</code>
                </pre>
              </div>
            </div>
          </section>

          <section className="mb-12" id="quickstart">
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <p className="text-on-surface-variant mb-6">
              Get started with Kuberna in just a few minutes. Install the SDK, initialize the client, and start building.
            </p>

            <div className="space-y-6">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">1. Initialize the client</h3>
                <CodeBlock code={`import { KubernaClient } from '${NPM_PACKAGE}';

const client = new KubernaClient({
  baseUrl: 'https://api.kuberna.com',
});`} />
              </div>

              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">2. Parse a natural language intent</h3>
                <CodeBlock code={`const intent = await client.ai.parseIntent(
  'swap 1 ETH for USDC on Solana'
);
console.log(intent);
// { sourceChain: 'ethereum', sourceToken: 'ETH',
//   sourceAmount: '1.0', destChain: 'solana',
//   destToken: 'USDC', confidence: 0.95 }`} />
              </div>

              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">3. Create a cross-chain payment</h3>
                <CodeBlock code={`const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'ETH',
  sourceAmount: '1.0',
  destChain: 'solana',
  destToken: 'USDC',
  minDestAmount: '4500',
  timeoutSeconds: 3600,
});`} />
              </div>
            </div>
          </section>

          <section className="mb-12" id="intents">
            <h2 className="text-2xl font-bold mb-4">Cross-Chain Intents</h2>
            <p className="text-on-surface-variant mb-6">
              Parse natural language into structured cross-chain intents using local AI.
            </p>
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Parse Intent</h3>
                <CodeBlock code={`const intent = await client.ai.parseIntent(
  'bridge 500 USDC from Ethereum to Arbitrum'
);`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Get Agent Decision</h3>
                <CodeBlock code={`const decision = await client.ai.getDecision(
  'agent-id-123',
  { strategies: ['arbitrage', 'yield'] }
);`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Market Analysis</h3>
                <CodeBlock code={`const analysis = await client.ai.analyze('ETH', {
  indicators: ['price', 'volume', 'volatility'],
});`} />
              </div>
            </div>
          </section>

          <section className="mb-12" id="payments">
            <h2 className="text-2xl font-bold mb-4">Payments</h2>
            <p className="text-on-surface-variant mb-6">
              Create and manage cross-chain payment intents.
            </p>
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Create Payment Intent</h3>
                <CodeBlock code={`const payment = await client.payment.createIntent({
  sourceChain: 'ethereum',
  sourceToken: 'USDC',
  sourceAmount: '500',
  destChain: 'arbitrum',
  destToken: 'USDC',
  minDestAmount: '499',
  timeoutSeconds: 3600,
});`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Check Status</h3>
                <CodeBlock code={`const status = await client.payment.getStatus(payment.id);
// { status: 'pending' | 'filled' | 'settled' | 'expired' }`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Release & Refund</h3>
                <CodeBlock code={`// Release funds (seller)
await client.payment.release(payment.id);

// Refund funds (buyer)
await client.payment.refund(payment.id);`} />
              </div>
            </div>
          </section>

          <section className="mb-12" id="tee">
            <h2 className="text-2xl font-bold mb-4">TEE Deployment</h2>
            <p className="text-on-surface-variant mb-6">
              Deploy agents in Trusted Execution Environments for secure, verifiable execution.
            </p>
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Create Enclave</h3>
                <CodeBlock code={`const enclave = await client.tee.createEnclave({
  name: 'trading-bot-1',
  image: 'kuberna/agent:latest',
  env: { STRATEGY: 'arbitrage', MAX_POSITION: '1000' },
});`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Verify Attestation</h3>
                <CodeBlock code={`const attestation = await client.tee.verifyAttestation(enclave.id);`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">List & Destroy</h3>
                <CodeBlock code={`// List all enclaves
const enclaves = await client.tee.listEnclaves();

// Destroy an enclave
await client.tee.destroyEnclave(enclave.id);`} />
              </div>
            </div>
          </section>

          <section className="mb-12" id="certificates">
            <h2 className="text-2xl font-bold mb-4">Certificates</h2>
            <p className="text-on-surface-variant mb-6">
              Mint and verify NFT course completion certificates.
            </p>
            <div className="space-y-4">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Mint Certificate</h3>
                <CodeBlock code={`const cert = await client.certificate.mint({
  courseId: 'defi-101',
  recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  metadata: { title: 'DeFi Fundamentals', grade: 'A' },
});`} />
              </div>
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">Verify & Query</h3>
                <CodeBlock code={`// Verify a certificate
const isValid = await client.certificate.verify(cert.tokenId);

// Get certificates for a user
const myCerts = await client.certificate.getByUser('0x...');

// Get certificates for a course
const courseCerts = await client.certificate.getByCourse('defi-101');`} />
              </div>
            </div>
          </section>

          <section className="mb-12" id="errors">
            <h2 className="text-2xl font-bold mb-4">Error Handling</h2>
            <p className="text-on-surface-variant mb-6">
              All SDK errors are typed for precise handling.
            </p>
            <CodeBlock code={`import {
  KubernaError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  NetworkError,
} from '${NPM_PACKAGE}';

try {
  await client.payment.getStatus('invalid-id');
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid input:', error.details);
  } else if (error instanceof AuthenticationError) {
    console.error('Auth failed:', error.message);
  } else if (error instanceof NetworkError) {
    console.error('Network issue:', error.message);
  } else if (error instanceof KubernaError) {
    console.error('SDK error:', error.code, error.message);
  }
}`} />
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">Next Steps</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/courses" className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-colors flex items-center gap-4">
                <BookOpen size={24} className="text-primary" />
                <div>
                  <h3 className="font-bold">Learn more</h3>
                  <p className="text-sm text-on-surface-variant">Video courses and tutorials</p>
                </div>
                <ChevronRight size={20} className="ml-auto text-on-surface-variant" />
              </Link>
              <Link href="/marketplace" className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-colors flex items-center gap-4">
                <Zap size={24} className="text-secondary" />
                <div>
                  <h3 className="font-bold">Explore intents</h3>
                  <p className="text-sm text-on-surface-variant">Join the marketplace</p>
                </div>
                <ChevronRight size={20} className="ml-auto text-on-surface-variant" />
              </Link>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}
