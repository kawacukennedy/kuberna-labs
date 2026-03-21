import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Cpu, Zap, Activity, ShieldCheck, Plus, Terminal, Settings, Globe, Play, StopCircle } from 'lucide-react';

export default function AgentsPage() {
  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Autonomous Agent Fleet</h1>
            <p className="text-text-secondary">Deploy and manage your fleet of intelligent agents across decentralized networks.</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2 py-3 px-8">
            <Plus size={18} /> Deploy New Agent
          </button>
        </div>

        {/* Filters & Tabs */}
        <div className="flex items-center justify-between mb-8 border-b border-glass-border">
          <div className="flex gap-12 overflow-x-auto pb-px">
            {['ALL', 'TEE SECURED', 'CLOUD DEPLOYED', 'DRAFT'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
              </button>
            ))}
          </div>
        </div>

        {/* Agent Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map((id) => (
            <div key={id} className="glass glass-card flex flex-col gap-6">
              <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   <div className={`p-3 rounded-2xl ${id % 2 === 0 ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                     <Cpu size={24} />
                   </div>
                   <div>
                     <h3 className="font-bold text-lg">Kuberna-Agent-v{id}</h3>
                     <span className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">{id % 2 === 0 ? 'ElizaOS' : 'LangChain'} Framework</span>
                   </div>
                 </div>
                 <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${id === 4 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {id === 4 ? 'Stopped' : 'Running'}
                 </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary flex items-center gap-1"><Globe size={14} /> Network</span>
                  <span className="font-bold">{id % 2 === 0 ? 'Arbitrum' : 'Polygon'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary flex items-center gap-1"><ShieldCheck size={14} /> Security</span>
                  <span className="font-bold">{id % 3 === 0 ? 'TEE Enabled' : 'Standard Cloud'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-text-secondary flex items-center gap-1"><Activity size={14} /> Health</span>
                  <div className="w-24 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <Link href={`/agents/${id}/ide`} className="btn btn-glass py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <Terminal size={14} /> Open IDE
                </Link>
                <button className="btn btn-glass py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                   <Settings size={14} /> Settings
                </button>
              </div>

              <button className={`btn w-full py-3 text-sm flex items-center justify-center gap-2 ${id === 4 ? 'btn-primary' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                {id === 4 ? <><Play size={16} /> Start Agent</> : <><StopCircle size={16} /> Stop Service</>}
              </button>
            </div>
          ))}

          {/* New Agent Empty State */}
          <div className="glass glass-card border-dashed border-2 flex flex-col items-center justify-center text-center p-12 hover:bg-surface transition-all group cursor-pointer">
            <div className="p-4 bg-primary/10 text-primary rounded-full group-hover:scale-110 transition-transform mb-6">
              <Plus size={40} />
            </div>
            <h3 className="text-xl font-bold mb-2">Deploy New Agent</h3>
            <p className="text-sm text-text-secondary">Start with a template or code from scratch.</p>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import Link from 'next/link';
