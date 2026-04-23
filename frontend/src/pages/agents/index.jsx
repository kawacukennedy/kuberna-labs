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

import { useState } from "react";

export default function NewAgentPage() {
  const [step, setStep] = useState(1);
  const [framework, setFramework] = useState("");
  const [tools, setTools] = useState([]);
  const [deployment, setDeployment] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const toggleTool = (tool) => {
    setTools((prev) =>
      prev.includes(tool)
        ? prev.filter((t) => t !== tool)
        : [...prev, tool]
    );
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <h1 className="text-3xl font-bold mb-2">Create Agent</h1>
        <p className="text-neutral-400 mb-6">
          Set up your AI agent in a few simple steps
        </p>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`flex-1 h-2 rounded ${
                step >= s ? "bg-indigo-500" : "bg-neutral-800"
              }`}
            />
          ))}
        </div>

        {/* STEP CONTENT */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Choose Framework
              </h2>

              <div className="grid gap-4">
                {["ElizaOS", "LangChain"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFramework(f)}
                    className={`p-4 rounded-lg border ${
                      framework === f
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-neutral-700"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Select Tools
              </h2>

              <div className="grid gap-3">
                {["Search", "Payments", "Storage"].map((tool) => (
                  <label
                    key={tool}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={tools.includes(tool)}
                      onChange={() => toggleTool(tool)}
                    />
                    <span>{tool}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Deployment
              </h2>

              <div className="grid gap-4">
                {["Cloud", "TEE"].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDeployment(d)}
                    className={`p-4 rounded-lg border ${
                      deployment === d
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-neutral-700"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                Review
              </h2>

              <div className="space-y-2 text-neutral-300">
                <p><strong>Framework:</strong> {framework || "-"}</p>
                <p><strong>Tools:</strong> {tools.join(", ") || "-"}</p>
                <p><strong>Deployment:</strong> {deployment || "-"}</p>
              </div>

              <button className="mt-6 w-full bg-green-600 py-3 rounded-lg">
                Create Agent
              </button>
            </div>
          )}
        </div>

        {/* NAVIGATION */}
        <div className="flex justify-between mt-6">
          <button
            onClick={back}
            disabled={step === 1}
            className="px-4 py-2 bg-neutral-800 rounded disabled:opacity-50"
          >
            Back
          </button>

          {step < 4 ? (
            <button
              onClick={next}
              className="px-4 py-2 bg-indigo-600 rounded"
            >
              Next
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
          }
