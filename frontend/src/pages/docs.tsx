import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Book, Code, Terminal, Zap, Shield, Search, ChevronRight, FileText, Globe, Layers } from 'lucide-react';

export default function DocsPage() {
   return (
      <Layout>
         <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
               {/* Docs Sidebar */}
               <div className="lg:col-span-1 border-r border-glass-border pr-8 pt-4">
                  <div className="mb-8 p-2 glass rounded-xl flex items-center gap-2">
                     <Search size={16} className="text-text-secondary ml-1" />
                     <input type="text" placeholder="Search docs..." className="bg-transparent border-none outline-none text-sm p-1 w-full" />
                  </div>

                  <div className="space-y-8">
                     <div>
                        <h4 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-4">Getting Started</h4>
                        <ul className="space-y-3 text-sm font-medium text-text-secondary">
                           <li className="text-primary font-bold">Introduction</li>
                           <li className="hover:text-text-primary cursor-pointer">Quick Start Guide</li>
                           <li className="hover:text-text-primary cursor-pointer">Architecture Overview</li>
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4">Core Concepts</h4>
                        <ul className="space-y-3 text-sm font-medium text-text-secondary">
                           <li className="hover:text-text-primary cursor-pointer">Agent Lifecycle</li>
                           <li className="hover:text-text-primary cursor-pointer">Cross-Chain Intents</li>
                           <li className="hover:text-text-primary cursor-pointer">TEE Security</li>
                           <li className="hover:text-text-primary cursor-pointer">zkTLS Attestation</li>
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mb-4">SDK Reference</h4>
                        <ul className="space-y-3 text-sm font-medium text-text-secondary">
                           <li className="hover:text-text-primary cursor-pointer">IntentManager</li>
                           <li className="hover:text-text-primary cursor-pointer">AgentManager</li>
                           <li className="hover:text-text-primary cursor-pointer">Blockchain Utilities</li>
                        </ul>
                     </div>
                  </div>
               </div>

               {/* Docs Content */}
               <div className="lg:col-span-3">
                  <div className="mb-12">
                     <h1 className="text-5xl font-bold mb-6">Introduction to Kuberna Labs</h1>
                     <p className="text-xl text-text-secondary leading-relaxed">
                        Kuberna Labs is a hybrid educational and technological platform that empowers developers to build, deploy, and manage autonomous AI agents operating across decentralized networks.
                     </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                     <div className="glass p-8 rounded-3xl hover:border-primary/30 transition-all group cursor-pointer">
                        <div className="p-3 bg-primary/10 text-primary w-fit rounded-2xl mb-6"><Zap size={24} /></div>
                        <h3 className="text-xl font-bold mb-2">Quick Start</h3>
                        <p className="text-sm text-text-secondary mb-4">Deploy your first cross-chain agent in under 5 minutes using our templates.</p>
                        <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-2 transition-all">
                           Read Guide <ChevronRight size={14} />
                        </div>
                     </div>
                     <div className="glass p-8 rounded-3xl hover:border-primary/30 transition-all group cursor-pointer">
                        <div className="p-3 bg-primary-dark/10 text-primary-dark w-fit rounded-2xl mb-6"><Code size={24} /></div>
                        <h3 className="text-xl font-bold mb-2">SDK Reference</h3>
                        <p className="text-sm text-text-secondary mb-4">Deep dive into our TypeScript SDK for full control over your agents.</p>
                        <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-widest group-hover:gap-2 transition-all">
                           Explore SDK <ChevronRight size={14} />
                        </div>
                     </div>
                  </div>

                  <section className="prose prose-slate max-w-none text-text-secondary leading-relaxed space-y-6">
                     <h2 className="text-3xl font-bold text-text-primary">What is an Agent?</h2>
                     <p>
                        In the context of Kuberna Labs, an **Agent** is an autonomous piece of software that executes specific strategies or &quot;Intents&quot; on decentralized networks. These agents are designed to be self-sovereign, meaning they can manage their own private keys (within a TEE) and make decisions based on on-chain and off-chain data.
                     </p>

                     <h3 className="text-2xl font-bold text-text-primary mt-12 mb-4">Core Pillars</h3>
                     <div className="space-y-8">
                        <div className="flex gap-6">
                           <div className="shrink-0 p-4 bg-surface rounded-2xl h-fit border border-glass-border"><Globe size={28} className="text-primary" /></div>
                           <div>
                              <h4 className="text-lg font-bold text-text-primary mb-2">Cross-Chain Interoperability</h4>
                              <p>Execute intents seamlessly across any supported EVM chain. Our routing layer handles the complexity of bridging, asset swapping, and gas optimization.</p>
                           </div>
                        </div>
                        <div className="flex gap-6">
                           <div className="shrink-0 p-4 bg-surface rounded-2xl h-fit border border-glass-border"><Shield size={28} className="text-secondary" /></div>
                           <div>
                              <h4 className="text-lg font-bold text-text-primary mb-2">Cryptographic Guarantees</h4>
                              <p>Leverage Trusted Execution Environments (TEEs) and Zero-Knowledge Proofs to ensure that your agent&apos;s code is running exactly as intended without third-party interference.</p>
                           </div>
                        </div>
                        <div className="flex gap-6">
                           <div className="shrink-0 p-4 bg-surface rounded-2xl h-fit border border-glass-border"><Layers size={28} className="text-primary" /></div>
                           <div>
                              <h4 className="text-lg font-bold text-text-primary mb-2">Programmable Intents</h4>
                              <p>Move beyond simple transactions. Define high-level goals (e.g., &quot;Keep my portfolio balanced 50/50 ETH/USDC&quot;) and let the agents handle the execution.</p>
                           </div>
                        </div>
                     </div>
                  </section>
               </div>
            </div>
         </div>
      </Layout>
   );
}

import Link from 'next/link';