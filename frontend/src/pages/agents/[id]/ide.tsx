import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Sidebar } from '@/components/layout/Sidebar';
import { Play, Square, Save, Terminal, Settings, Activity, ChevronDown, Copy, Check } from 'lucide-react';

const logs = [
  { time: '10:42:15', level: 'INFO', message: 'Agent initialized successfully' },
  { time: '10:42:18', level: 'INFO', message: 'Connected to Arbitrum network' },
  { time: '10:42:22', level: 'DEBUG', message: 'Checking intent queue...' },
  { time: '10:42:25', level: 'INFO', message: 'New intent detected: SWAP 100 USDC -> ETH' },
  { time: '10:42:28', level: 'INFO', message: 'Executing swap via Uniswap V3' },
  { time: '10:42:32', level: 'INFO', message: 'Swap completed: 0.042 ETH received' },
];

export default function AgentIDEPage() {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Layout variant="dashboard">
      <div className="flex h-screen">
        {/* IDE Sidebar */}
        <aside className="w-16 lg:w-64 bg-surface border-r border-outline/10 flex flex-col">
          <div className="p-4 border-b border-outline/10">
            <h2 className="text-lg font-bold hidden lg:block">Alpha-Arbitrage-v1</h2>
            <span className="text-xs hidden lg:block text-secondary">Running</span>
          </div>
          <nav className="flex-1 p-2 space-y-1">
            <button className="w-full sidebar-item justify-center lg:justify-start">
              <Terminal size={18} /> <span className="hidden lg:inline">Editor</span>
            </button>
            <button className="w-full sidebar-item justify-center lg:justify-start">
              <Activity size={18} /> <span className="hidden lg:inline">Logs</span>
            </button>
            <button className="w-full sidebar-item justify-center lg:justify-start">
              <Settings size={18} /> <span className="hidden lg:inline">Config</span>
            </button>
          </nav>
          <div className="p-4 border-t border-outline/10">
            <button className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Play size={16} /> <span className="hidden lg:inline">Deploy</span>
            </button>
          </div>
        </aside>

        {/* Main IDE Area */}
        <main className="flex-1 flex flex-col">
          {/* Top Bar */}
          <header className="h-14 bg-surface border-b border-outline/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">main.ts</span>
              <span className="text-xs text-secondary">agent.ts</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-glass px-3 py-1.5 text-sm flex items-center gap-2">
                <Copy size={14} /> {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="btn btn-primary px-3 py-1.5 text-sm flex items-center gap-2">
                <Save size={14} /> Save
              </button>
            </div>
          </header>

          {/* Editor + Logs Split */}
          <div className="flex-1 flex">
            {/* Code Editor */}
            <div className="flex-1 flex">
              <div className="w-12 bg-surface border-r border-outline/10 flex flex-col items-center py-4 gap-2 text-xs text-secondary">
                {[...Array(20)].map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </div>
              <textarea 
                className="flex-1 bg-surface-dim p-4 font-mono text-sm resize-none outline-none"
                defaultValue={`import { Kuberna } from '@kuberna/sdk';

const agent = new Kuberna.Agent({
  name: 'Alpha-Arbitrage-v1',
  chain: 'arbitrum',
  // Configure arbitrage parameters
  params: {
    minProfit: 10, // USD
    slippage: 0.5, // %
    gasLimit: 500000,
  },
});

agent.on('intent', async (intent) => {
  // Cross-chain arbitrage logic
  if (intent.type === 'swap') {
    const result = await executeSwap(intent);
    await agent.settle(result);
  }
});

agent.on('error', async (error) => {
  console.error('Agent error:', error);
  await agent.notify('error', error);
});

export default agent;`}
              />
            </div>

            {/* Terminal Logs */}
            <div className="w-96 bg-black flex flex-col border-l border-outline/10">
              <div className="h-10 bg-surface flex items-center px-4 text-sm font-bold border-b border-outline/10">
                <Terminal size={16} className="mr-2" /> Terminal
              </div>
              <div className="flex-1 p-4 font-mono text-sm overflow-y-auto">
                {logs.map((log, i) => (
                  <div key={i} className="flex gap-4 mb-2">
                    <span className="text-secondary">{log.time}</span>
                    <span className={`font-bold ${
                      log.level === 'INFO' ? 'text-green-400' : 
                      log.level === 'DEBUG' ? 'text-blue-400' : 'text-red-400'
                    }`}>
                      {log.level}
                    </span>
                    <span className="text-white">{log.message}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-secondary">Listening for events...</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}