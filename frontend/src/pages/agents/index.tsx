import React, { useState } from 'react';
import Head from 'next/head';
import { Layout } from '@/components/layout/Layout';
import { Cpu, Play, Square, Settings, Plus, Bot } from 'lucide-react';
import Link from 'next/link';
import { AIAssistant } from '@/components/AIAssistant';

interface AgentSuggestion {
  name: string;
  description: string;
  framework: 'ELIZAOS' | 'LANGCHAIN' | 'AUTOGEN' | 'RIG';
  tools: string[];
  deploymentType: 'CLOUD' | 'TEE' | 'LOCAL';
  model: string;
  config: Record<string, unknown>;
}

const agents = [
  { id: 1, name: 'Alpha-Arbitrage-v1', status: 'running', chain: 'Ethereum', tasks: 156, earnings: '450 USDC', lastActive: '2m ago' },
  { id: 2, name: 'Beta-Swap-v2', status: 'stopped', chain: 'Arbitrum', tasks: 89, earnings: '220 USDC', lastActive: '1h ago' },
  { id: 3, name: 'Gamma-Yield-v1', status: 'running', chain: 'Polygon', tasks: 234, earnings: '890 USDC', lastActive: '5m ago' },
];

const FRAMEWORK_OPTIONS = ['ELIZAOS', 'LANGCHAIN', 'AUTOGEN', 'RIG'];
const DEPLOYMENT_OPTIONS = ['CLOUD', 'TEE', 'LOCAL'];
const TOOL_OPTIONS = ['swap', 'monitor', 'bridge', 'alert', 'governance', 'nft', 'balance', 'price_feed', 'data_fetch', 'risk_analysis'];

export default function AgentsPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<'ai' | 'manual' | 'create'>('ai');
  const [suggestion, setSuggestion] = useState<AgentSuggestion | null>(null);

  const [formName, setFormName] = useState('');
  const [formFramework, setFormFramework] = useState('ELIZAOS');
  const [formTools, setFormTools] = useState<string[]>([]);
  const [formDeployment, setFormDeployment] = useState('CLOUD');
  const [formDescription, setFormDescription] = useState('');

  const handleAISuggestion = (s: AgentSuggestion) => {
    setSuggestion(s);
    setFormName(s.name);
    setFormFramework(s.framework);
    setFormTools(s.tools);
    setFormDeployment(s.deploymentType);
    setFormDescription(s.description);
    setWizardStep('manual');
  };

  const handleCreate = async () => {
    const payload = {
      name: formName,
      description: formDescription,
      framework: formFramework.toLowerCase(),
      model: 'local',
      config: {
        tools: formTools,
        ...(suggestion?.config || {}),
      },
      tools: formTools,
      deploymentType: formDeployment,
      pricingModel: 'fixed',
      price: 10,
    };

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowWizard(false);
        setWizardStep('ai');
        setSuggestion(null);
        window.location.reload();
      } else {
        const err = await res.json();
        alert(err.error?.message || 'Failed to create agent');
      }
    } catch {
      alert('Failed to create agent. Ensure the backend is running.');
    }
  };

  const toggleTool = (tool: string) => {
    setFormTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool],
    );
  };

  return (
    <Layout variant="dashboard">
      <Head><title>Agents — Kuberna Labs</title></Head>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Agents</h1>
            <p className="text-on-surface-variant">Manage your autonomous agents</p>
          </div>
          <button
            onClick={() => { setShowWizard(true); setWizardStep('ai'); setSuggestion(null); }}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} /> Create Agent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  agent.status === 'running'
                    ? 'bg-secondary-container text-secondary orb-active'
                    : 'bg-surface-dim text-on-surface-variant'
                }`}>
                  <Cpu size={20} />
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                  agent.status === 'running' ? 'bg-secondary text-white' : 'bg-surface-dim text-on-surface-variant'
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

          <button
            onClick={() => { setShowWizard(true); setWizardStep('ai'); setSuggestion(null); }}
            className="border-2 border-dashed border-outline/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 hover:border-primary hover:bg-surface-container-low transition-colors min-h-[280px]"
          >
            <div className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center">
              <Plus size={24} className="text-primary" />
            </div>
            <p className="text-sm font-medium text-on-surface-variant">Deploy New Agent</p>
          </button>
        </div>
      </div>

      {showWizard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-surface rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {wizardStep === 'ai' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Create New Agent</h2>
                  <button onClick={() => setShowWizard(false)} className="p-2 hover:bg-surface-container rounded-lg text-2xl leading-none">&times;</button>
                </div>

                <AIAssistant
                  onApply={handleAISuggestion}
                  onClose={() => setShowWizard(false)}
                />

                <div className="mt-4 text-center">
                  <button
                    onClick={() => setWizardStep('manual')}
                    className="text-sm text-primary hover:underline"
                  >
                    Or configure manually
                  </button>
                </div>
              </div>
            )}

            {wizardStep === 'manual' && (
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setWizardStep('ai')} className="p-1 hover:bg-surface-container rounded-lg">
                    <Bot size={20} className="text-primary" />
                  </button>
                  <h2 className="text-2xl font-bold flex-1">
                    {suggestion ? 'Review Configuration' : 'Configure Agent'}
                  </h2>
                  <button onClick={() => setShowWizard(false)} className="p-2 hover:bg-surface-container rounded-lg text-2xl leading-none">&times;</button>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                      placeholder="My Agent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Description</label>
                    <textarea
                      value={formDescription}
                      onChange={e => setFormDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                      placeholder="What does this agent do?"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Framework</label>
                      <select
                        value={formFramework}
                        onChange={e => setFormFramework(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none appearance-none"
                      >
                        {FRAMEWORK_OPTIONS.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Deployment</label>
                      <select
                        value={formDeployment}
                        onChange={e => setFormDeployment(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-low border border-outline/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none appearance-none"
                      >
                        {DEPLOYMENT_OPTIONS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-on-surface mb-2">Tools</label>
                    <div className="flex flex-wrap gap-2">
                      {TOOL_OPTIONS.map(tool => (
                        <button
                          key={tool}
                          onClick={() => toggleTool(tool)}
                          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                            formTools.includes(tool)
                              ? 'bg-primary text-white border-primary'
                              : 'bg-surface-container-low border-outline/10 hover:border-primary/50'
                          }`}
                        >
                          {tool}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setWizardStep('ai')} className="btn btn-glass flex-1">
                      Back
                    </button>
                    <button onClick={handleCreate} className="btn btn-primary flex-1">
                      Deploy Agent
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
