import React, { useState } from 'react';
import { Bot, Sparkles, Loader2, CheckCircle, AlertCircle, ArrowRight, Cpu, Wallet, Zap, Shield } from 'lucide-react';

interface AgentSuggestion {
  name: string;
  description: string;
  framework: 'ELIZAOS' | 'LANGCHAIN' | 'AUTOGEN' | 'RIG';
  tools: string[];
  deploymentType: 'CLOUD' | 'TEE' | 'LOCAL';
  model: string;
  config: Record<string, unknown>;
}

interface IntentParseResult {
  sourceChain: string;
  sourceToken: string;
  sourceAmount: string;
  destChain: string;
  destToken: string;
  minDestAmount: string;
  timeoutSeconds: number;
  budget: number;
  currency: string;
  confidence: number;
  rawDescription: string;
}

const FRAMEWORK_HEURISTICS: Array<{
  patterns: RegExp[];
  framework: 'ELIZAOS' | 'LANGCHAIN' | 'AUTOGEN' | 'RIG';
  tools: string[];
  deploymentType: 'CLOUD' | 'TEE';
  model: string;
}> = [
  {
    patterns: [/trad(e|ing)/i, /swap/i, /arbitrage/i, /liquidit/i, /yield/i, /defi/i],
    framework: 'ELIZAOS',
    tools: ['swap', 'monitor', 'balance', 'price_feed'],
    deploymentType: 'CLOUD',
    model: 'plugin-trading',
  },
  {
    patterns: [/monitor/i, /alert/i, /watch/i, /notif/i, /track/i, /observe/i],
    framework: 'LANGCHAIN',
    tools: ['alert', 'webhook', 'data_fetch', 'notification'],
    deploymentType: 'CLOUD',
    model: 'gpt-4',
  },
  {
    patterns: [/govern/i, /vote/i, /dao/i, /proposal/i],
    framework: 'LANGCHAIN',
    tools: ['governance', 'vote', 'analysis', 'alert'],
    deploymentType: 'TEE',
    model: 'gpt-4',
  },
  {
    patterns: [/nft/i, /collect/i, /flip/i, /mint/i],
    framework: 'AUTOGEN',
    tools: ['nft', 'marketplace', 'price_check'],
    deploymentType: 'CLOUD',
    model: 'multi-agent',
  },
  {
    patterns: [/cross.chain/i, /bridge/i, /transfer/i],
    framework: 'ELIZAOS',
    tools: ['cross_chain', 'swap', 'bridge', 'balance'],
    deploymentType: 'TEE',
    model: 'plugin-cross-chain',
  },
  {
    patterns: [/risk/i, /compliance/i, /audit/i, /security/i],
    framework: 'RIG',
    tools: ['audit', 'risk_analysis', 'report', 'monitor'],
    deploymentType: 'TEE',
    model: 'rig-security',
  },
];

const DEFAULT_HEURISTIC = {
  framework: 'ELIZAOS' as const,
  tools: ['monitor', 'swap'] as string[],
  deploymentType: 'CLOUD' as const,
  model: 'plugin-default',
};

const INTENT_EXAMPLES = [
  'swap 1 ETH for USDC on Solana',
  'bridge 500 USDC from Ethereum to Arbitrum',
  'monitor ETH price and alert if it drops below 3000',
  'buy NFTs on OpenSea under 2 ETH',
  'vote on Aave governance proposal',
  'yield farm on Aave with 10000 USDC',
];

function extractAgentName(description: string): string {
  const words = description.split(/\s+/).slice(0, 3);
  return words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('-')
    .replace(/[^a-zA-Z0-9-]/g, '') + '-Agent';
}

function generateSuggestion(description: string, intentResult?: IntentParseResult): AgentSuggestion {
  const name = extractAgentName(description);
  let framework: AgentSuggestion['framework'] = DEFAULT_HEURISTIC.framework;
  let tools: string[] = [...DEFAULT_HEURISTIC.tools];
  let deploymentType: AgentSuggestion['deploymentType'] = DEFAULT_HEURISTIC.deploymentType;
  let model = DEFAULT_HEURISTIC.model;

  for (const heuristic of FRAMEWORK_HEURISTICS) {
    if (heuristic.patterns.some(p => p.test(description))) {
      framework = heuristic.framework;
      tools = [...heuristic.tools];
      deploymentType = heuristic.deploymentType;
      model = heuristic.model;
      break;
    }
  }

  if (/tee|secure|enclave|confidential/i.test(description)) {
    deploymentType = 'TEE';
  }

  const config: Record<string, unknown> = {
    description,
    chain: intentResult?.sourceChain || 'ethereum',
    sourceToken: intentResult?.sourceToken || 'ETH',
    destToken: intentResult?.destToken || 'USDC',
  };

  if (intentResult && intentResult.sourceAmount !== '0') {
    config.defaultAmount = intentResult.sourceAmount;
  }

  return { name, description, framework, tools, deploymentType, model, config };
}

interface AIAssistantProps {
  onApply: (suggestion: AgentSuggestion) => void;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onApply, onClose: _onClose }) => {
  const [input, setInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [suggestion, setSuggestion] = useState<AgentSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intentResult, setIntentResult] = useState<IntentParseResult | undefined>();

  const handleParse = async () => {
    if (!input.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      let parsedIntent: IntentParseResult | undefined;

      try {
        const res = await fetch('/api/intents/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: input.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          parsedIntent = data.data;
          setIntentResult(parsedIntent);
        }
      } catch {
        // Backend might not be running - use client-side parsing
      }

      const agentSuggestion = generateSuggestion(input.trim(), parsedIntent);
      setSuggestion(agentSuggestion);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse description');
    } finally {
      setIsParsing(false);
    }
  };

  const handleApply = () => {
    if (suggestion) {
      onApply(suggestion);
    }
  };

  const handleExampleClick = (example: string) => {
    setInput(example);
  };

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 border border-primary/10">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Bot size={22} className="text-primary" />
        </div>
        <div>
          <h3 className="font-bold text-lg">AI Agent Assistant</h3>
          <p className="text-sm text-on-surface-variant">
            Describe what you want your agent to do
          </p>
        </div>
      </div>

      {!suggestion ? (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleParse()}
              placeholder="e.g., swap 1 ETH for USDC on Solana"
              className="flex-1 px-4 py-3 bg-surface-container-low border border-outline/10 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm"
            />
            <button
              onClick={handleParse}
              disabled={isParsing || !input.trim()}
              className="btn btn-primary px-4 py-3 flex items-center gap-2 disabled:opacity-50"
            >
              {isParsing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Sparkles size={18} />
              )}
              Suggest
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {INTENT_EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => handleExampleClick(ex)}
                className="text-xs px-3 py-1.5 bg-surface-container rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant"
              >
                {ex}
              </button>
            ))}
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-error text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-secondary text-sm">
            <CheckCircle size={16} />
            Agent configuration generated
          </div>

          <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Name</span>
              <span className="font-medium text-sm">{suggestion.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Framework</span>
              <span className="flex items-center gap-1.5 text-sm">
                <Cpu size={14} className="text-primary" />
                {suggestion.framework}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Tools</span>
              <span className="flex gap-1">
                {suggestion.tools.map(t => (
                  <span key={t} className="text-xs px-2 py-0.5 bg-primary/10 rounded-full">
                    {t}
                  </span>
                ))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Deployment</span>
              <span className="flex items-center gap-1.5 text-sm">
                {suggestion.deploymentType === 'TEE' ? (
                  <Shield size={14} className="text-accent" />
                ) : (
                  <Wallet size={14} className="text-secondary" />
                )}
                {suggestion.deploymentType}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Description</span>
              <span className="text-sm text-right max-w-[200px] truncate">{suggestion.description}</span>
            </div>
          </div>

          {intentResult && (
            <div className="bg-secondary/5 rounded-xl p-3 border border-secondary/10">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary mb-2 flex items-center gap-1.5">
                <Zap size={12} /> Parsed Intent
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-on-surface-variant">From: </span>{intentResult.sourceAmount} {intentResult.sourceToken} on {intentResult.sourceChain}</div>
                <div><span className="text-on-surface-variant">To: </span>{intentResult.destToken} on {intentResult.destChain}</div>
                <div><span className="text-on-surface-variant">Confidence: </span>{(intentResult.confidence * 100).toFixed(0)}%</div>
                <div><span className="text-on-surface-variant">Budget: </span>{intentResult.budget} {intentResult.currency}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={handleApply} className="btn btn-primary flex-1 flex items-center justify-center gap-2">
              <ArrowRight size={16} /> Apply Configuration
            </button>
            <button
              onClick={() => { setSuggestion(null); setIntentResult(undefined); setInput(''); }}
              className="btn btn-glass px-4"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
