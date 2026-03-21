import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Terminal, Save, Play, CheckCircle2, ChevronRight, FileCode, Cpu, ShieldCheck, Database, Zap } from 'lucide-react';

export default function AgentIdePage() {
  const [activeFile, setActiveFile] = useState('agent.ts');
  const [consoleOutput, setConsoleOutput] = useState(['Initializing Kuberna Agent environment...', 'Connecting to Arbitrum RPC...', 'System Ready.']);
  const [isDeploying, setIsDeploying] = useState(false);

  const handleRun = () => {
     setConsoleOutput([...consoleOutput, '> Run triggered...', 'Compiling TypeScript...', 'Starting execution in local sandbox...']);
  };

  const handleDeploy = () => {
    setIsDeploying(true);
    setConsoleOutput([...consoleOutput, '> Deploy triggered (TEE Target)...', 'Encrypting code bundle...', 'Uploading to secure attestation server...']);
    setTimeout(() => {
       setIsDeploying(false);
       setConsoleOutput([...consoleOutput, 'Deployment Successful!', 'Agent Live at: 0x82...a4f3']);
    }, 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F172A] text-slate-300 font-sans">
      {/* IDE Top Bar */}
      <nav className="h-14 border-b border-slate-800 bg-[#1E293B] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-6">
          <Link href="/agents" className="text-primary font-bold tracking-tighter text-xl">
             KUBERNA <span className="text-slate-400 font-normal">IDE</span>
          </Link>
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
             <Cpu size={14} className="text-primary" />
             <span className="text-xs font-semibold">Alpha-Bot-v1</span>
             <ChevronRight size={12} />
             <span className="text-xs text-slate-400">Main Fleet</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handleRun} className="flex items-center gap-2 px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors">
            <Play size={16} fill="white" className="text-white" /> Run
          </button>
          <button onClick={handleDeploy} disabled={isDeploying} className="btn btn-primary px-6 py-1.5 text-sm flex items-center gap-2">
            {isDeploying ? 'Deploying...' : <><Zap size={16} /> Deploy to TEE</>}
          </button>
        </div>
      </nav>

      <div className="flex-grow flex overflow-hidden">
        {/* IDE Sidebar */}
        <div className="w-64 border-r border-slate-800 bg-[#0F172A] shrink-0 p-4 space-y-6">
           <div>
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Files</h4>
             <ul className="space-y-2">
               {['agent.ts', 'config.json', 'tools.ts', 'schema.prisma'].map(file => (
                 <li 
                   key={file}
                   onClick={() => setActiveFile(file)}
                   className={`flex items-center gap-2 p-2 rounded-lg text-sm cursor-pointer transition-colors ${activeFile === file ? 'bg-primary/20 text-white border border-primary/50' : 'hover:bg-slate-800'}`}
                 >
                   <FileCode size={16} className={activeFile === file ? 'text-primary' : 'text-slate-400'} /> {file}
                 </li>
               ))}
             </ul>
           </div>
           
           <div>
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Integration</h4>
             <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs opacity-70">
                   <ShieldCheck size={14} /> TEE Enabled
                </div>
                <div className="flex items-center gap-3 text-xs opacity-70">
                   <Database size={14} /> DB Sync: Active
                </div>
             </div>
           </div>
        </div>

        {/* Code Editor (Simulated) */}
        <div className="flex-grow flex flex-col min-w-0">
          <div className="flex-grow p-8 bg-[#0F172A] overflow-auto font-mono text-sm leading-relaxed">
            <pre className="text-emerald-400">
{`import { KubernaSDK } from "@kuberna/sdk";

// Initialize Alpha-Bot-v1
const agent = new KubernaSDK.Agent({
  name: "Alpha-Bot-v1",
  strategy: "mean-reversion",
});

async function main() {
  console.log("Starting agent cycle...");
  
  // Monitor cross-chain intents
  const intents = await agent.getMarketIntents({
    chains: ["ethereum", "arbitrum"],
    minBudget: "100.0"
  });

  for (const intent of intents) {
    if (agent.canFulfill(intent)) {
      console.log(\`Submitting bid for intent: \${intent.id}\`);
      await agent.submitBid(intent.id, {
        price: intent.budget * 0.95,
        time: 300 // 5 minutes
      });
    }
  }
}

main().catch(console.error);`}
            </pre>
          </div>

          {/* Console */}
          <div className="h-48 border-t border-slate-800 bg-[#020617] shrink-0">
             <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-[#0F172A]">
               <Terminal size={14} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Console Output</span>
             </div>
             <div className="p-4 font-mono text-xs space-y-1 overflow-auto h-full pb-8">
               {consoleOutput.map((out, idx) => (
                 <div key={idx} className={out.startsWith('>') ? 'text-primary' : 'text-slate-500'}>
                   {out}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
