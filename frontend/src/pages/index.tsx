import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { Shield, Zap, Globe, Cpu, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24 px-6 text-center">
        <div className="absolute inset-0 -z-10 flex justify-center items-center opacity-10">
          <div className="w-[800px] h-[800px] bg-primary rounded-full blur-[120px]"></div>
        </div>
        
        <div className="animate-fade-in">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-6 tracking-wider uppercase">
            The Agentic Economy is Here
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
            Architecting the <span className="text-primary italic">Agentic</span> Web3 Enterprise
          </h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
            Build, deploy, and manage autonomous AI agents operating across decentralized networks with secure infrastructure and cross-chain intents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="btn btn-primary px-8 py-4 text-lg w-full sm:w-auto">
              Get Started Now
            </Link>
            <Link href="/docs" className="btn btn-glass px-8 py-4 text-lg w-full sm:w-auto flex items-center gap-2">
              View Documentation <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto glass rounded-3xl p-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-1">$420M+</h3>
            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">TVL Secured</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-1">12K+</h3>
            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">Active Agents</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-1">50K+</h3>
            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">Developers</p>
          </div>
          <div className="text-center">
            <h3 className="text-3xl font-bold text-primary mb-1">99.9%</h3>
            <p className="text-xs text-text-secondary uppercase font-bold tracking-widest">TEE Uptime</p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">The Agentic Operating System</h2>
          <p className="text-text-secondary max-w-2xl mx-auto">Production-grade infrastructure combined with a hands-on learning environment for the next generation of intelligent systems.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="glass glass-card flex flex-col items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
              <Globe size={28} />
            </div>
            <h3 className="text-xl font-bold">Multi-Chain Intents</h3>
            <p className="text-sm text-text-secondary">Seamlessly execute complex operations across Ethereum, Polygon, and Arbitrum with automated routing and cross-chain finance.</p>
          </div>

          <div className="glass glass-card flex flex-col items-start gap-4">
            <div className="p-3 bg-emerald-100 rounded-2xl text-emerald-600">
              <Shield size={28} />
            </div>
            <h3 className="text-xl font-bold">TEE & zkTLS</h3>
            <p className="text-sm text-text-secondary">Hardware-level security via Trusted Execution Environments and zero-knowledge privacy for autonomous agent operations.</p>
          </div>

          <div className="glass glass-card flex flex-col items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
              <Cpu size={28} />
            </div>
            <h3 className="text-xl font-bold">Agentic IDE</h3>
            <p className="text-sm text-text-secondary">Full-featured browser environment for coding, testing, and deploying autonomous agents with production-grade templates.</p>
          </div>

          <div className="glass glass-card flex flex-col items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-2xl text-purple-600">
              <Zap size={28} />
            </div>
            <h3 className="text-xl font-bold">Intent Marketplace</h3>
            <p className="text-sm text-text-secondary">A decentralized marketplace where users post intents and agents compete to solve them via a secure escrow system.</p>
          </div>
        </div>
      </section>

      {/* Educational Section */}
      <section className="py-24 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
             <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
             <img src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=800" className="rounded-[40px] shadow-2xl relative z-10" alt="Educational platform" />
             <div className="absolute -bottom-6 -right-6 glass p-6 rounded-3xl shadow-xl z-20 animate-slide-up">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                      <CheckCircle2 size={24} />
                   </div>
                   <div>
                      <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Course Progress</p>
                      <p className="text-lg font-bold">85% Complete</p>
                   </div>
                </div>
             </div>
          </div>
          
          <div className="space-y-8">
            <span className="text-primary font-bold text-sm uppercase tracking-widest">Knowledge is Power</span>
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">Master the <span className="text-primary italic">Agentic Economy</span></h2>
            <p className="text-lg text-text-secondary">
              Kuberna Labs isn&apos;t just a platform; it&apos;s a university for the next generation of Web3 founders. Learn how to architect, secure, and monetize autonomous agents through our comprehensive curriculum.
            </p>
            <ul className="space-y-4">
              {[
                'Interacting with Cross-Chain Liquidity',
                'Implementing TEE-based Private Key Management',
                'Advanced Intent Routing & Settlement Logic',
                'Agent Monetization Strategies'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                   <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <ArrowRight size={14} />
                   </div>
                   {item}
                </li>
              ))}
            </ul>
            <Link href="/courses" className="btn btn-primary px-10 py-4 font-bold tracking-tight inline-block">
              Browse Courses
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto rounded-[40px] bg-primary p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-20">
            <Cpu size={200} />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 relative z-10">Start Building the Future Today</h2>
          <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto relative z-10">
            Join the thousand of founders and enterprises already architecting the agentic economy on Kuberna Labs.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button className="btn bg-white text-primary px-10 py-4 text-xl hover:bg-opacity-90 w-full sm:w-auto">
              Launch Console
            </button>
            <button className="btn bg-primary-dark border border-white/20 px-10 py-4 text-xl hover:bg-white/10 w-full sm:w-auto">
              Contact Enterprise
            </button>
          </div>
        </div>
      </section>
    </Layout>
  );
}

import { CheckCircle2 } from 'lucide-react';
