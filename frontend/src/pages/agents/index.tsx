import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Sidebar } from '@/components/layout/Sidebar';
import { Cpu, Play, Square, Settings, Trash2, Activity, Plus, Zap, Search, ChevronDown, Layers } from 'lucide-react';
import Link from 'next/link';

const agents = [
  { id: 1, name: 'Alpha-Arbitrage-v1', status: 'running', chain: 'Ethereum', tasks: 156, earnings: '450 USDC', lastActive: '2m ago' },
  { id: 2, name: 'Beta-Swap-v2', status: 'stopped', chain: 'Arbitrum', tasks: 89, earnings: '220 USDC', lastActive: '1h ago' },
  { id: 3, name: 'Gamma-Yield-v1', status: 'running', chain: 'Polygon', tasks: 234, earnings: '890 USDC', lastActive: '5m ago' },
];

export default function AgentsPage() {
  const [showWizard, setShowWizard] = useState(false);

  return (
    <Layout variant="dashboard">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Agents</h1>
            <p className="text-on-surface-variant">Manage your autonomous agents</p>
          </div>
          <button 
            onClick={() => setShowWizard(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Create Agent
          </button>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  agent.status === 'running' 
                    ? 'bg-secondary-container text-secondary orb-active' 
                    : 'bg-surface-dim text-on-surface-variant'
                }`}>
                  <Cpu size={20} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  agent.status === 'running'
                    ? 'bg-secondary text-white'
                    : 'bg-surface-dim text-on-surface-variant'
                }`}>
                  {agent.status}
                </span>
              </div>
              
              <h3 className="text-lg font-bold mb-2">{agent.name}</h3>
              <p className="text-xs text-on-surface-variant mb-4">Chain: {agent.chain}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">Tasks</p>
                  <p className="font-bold">{agent.tasks}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant uppercase tracking-widest">Earnings</p>
                  <p className="font-bold">{agent.earnings}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-outline/10">
                <span className="text-xs text-on-surface-variant">Last active: {agent.lastActive}</span>
                <div className="flex gap-2">
                  <Link href={`/agents/${agent.id}/ide`} className="p-2 hover:bg-surface rounded-lg transition-colors">
                    <Settings size={16} className="text-on-surface-variant" />
                  </Link>
                  {agent.status === 'running' ? (
                    <button className="p-2 hover:bg-surface rounded-lg transition-colors">
                      <Square size={16} className="text-error" />
                    </button>
                  ) : (
                    <button className="p-2 hover:bg-surface rounded-lg transition-colors">
                      <Play size={16} className="text-secondary" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Create New Agent Card */}
          <button 
            onClick={() => setShowWizard(true)}
            className="border-2 border-dashed border-outline/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-surface-container-low transition-colors min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
              <Plus size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Deploy New Agent</p>
          </button>
        </div>
      </div>

      {/* Create Agent Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-surface rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Create New Agent</h2>
              <button onClick={() => setShowWizard(false)} className="p-2 hover:bg-surface-container rounded-lg">
                &times;
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Agent Name</label>
                <input 
                  type="text" 
                  placeholder="My Agent"
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-lg focus:ring-0 focus:border-primary" 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Framework</label>
                <select className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-lg appearance-none">
                  <option>ElizaOS</option>
                  <option>LangChain</option>
                  <option>Custom</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Chain</label>
                <div className="flex gap-3 flex-wrap">
                  {['Ethereum', 'Arbitrum', 'Polygon', 'Solana'].map((chain) => (
                    <button key={chain} className="px-4 py-2 bg-surface-container-low rounded-lg hover:bg-surface-container text-sm">
                      {chain}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary w-full py-4">
                Deploy Agent
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}