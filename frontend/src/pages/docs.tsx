import React from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { FileText, Code, BookOpen, Zap, ChevronRight, Search, Copy, Check, Terminal, Cpu, Shield, Link2 } from 'lucide-react';
import { useState } from 'react';

export default function DocsPage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText('npm install @kuberna/sdk');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout>
      <div className="flex min-h-screen">
        {/* Sidebar */}
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
              <Link href="/docs#agents" className="sidebar-item">
                <Cpu size={18} /> Creating Agents
              </Link>
              <Link href="/docs#tee" className="sidebar-item">
                <Shield size={18} /> TEE Deployment
              </Link>
              <Link href="/docs#intents" className="sidebar-item">
                <Link2 size={18} /> Cross-Chain Intents
              </Link>
              <Link href="/docs#api" className="sidebar-item">
                <Code size={18} /> API Reference
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 px-6 py-12 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Documentation</h1>
            <p className="text-on-surface-variant text-lg">Everything you need to build with Kuberna Labs.</p>
          </div>

          {/* Terminal Installation Block */}
          <section className="mb-12">
            <div className="bg-surface-dim rounded-xl overflow-hidden">
              <div className="flex gap-2 px-4 py-3 bg-surface border-b border-outline/10">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="p-6">
                <pre className="font-mono text-sm">
                  <code>npm install @kuberna/sdk</code>
                </pre>
              </div>
            </div>
          </section>

          {/* Quick Start */}
          <section className="mb-12" id="quickstart">
            <h2 className="text-2xl font-bold mb-4">Quick Start</h2>
            <p className="text-on-surface-variant mb-6">
              Get started with Kuberna in just a few minutes. Install the SDK, create your first agent, and deploy to the network.
            </p>
            
            <div className="space-y-6">
              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">1. Initialize your agent</h3>
                <div className="bg-surface-dim rounded-lg p-4 font-mono text-sm">
                  <code>{`import { Kuberna } from '@kuberna/sdk';

const agent = new Kuberna.Agent({
  name: 'my-first-agent',
  chain: 'ethereum',
});
`}</code>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">2. Define your logic</h3>
                <div className="bg-surface-dim rounded-lg p-4 font-mono text-sm">
                  <code>{`agent.on('intent', async (intent) => {
  // Handle cross-chain intents
  const result = await agent.execute(intent);
  return result;
});
`}</code>
                </div>
              </div>

              <div className="bg-surface-container-low rounded-xl p-6">
                <h3 className="font-bold mb-4">3. Deploy to network</h3>
                <div className="bg-surface-dim rounded-lg p-4 font-mono text-sm">
                  <code>{`await agent.deploy({
  network: 'arbitrum',
  tee: true, // Deploy in TEE
});`}</code>
                </div>
              </div>
            </div>
          </section>

          {/* Next Steps */}
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