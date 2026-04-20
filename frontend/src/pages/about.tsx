import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { ArrowRight, Globe, Users, Rocket } from 'lucide-react';

const team = [
  { name: 'Arnaud Kennedy', title: 'CEO & Founder', bio: 'Former Google, building the agentic economy' },
  { name: 'Sarah Chen', title: 'CTO', bio: 'ex-Phala, TEE security expert' },
  { name: 'Michael Rodriguez', title: 'Head of Product', bio: 'ex-Aave, DeFi veteran' },
  { name: 'Lisa Park', title: 'Head of Research', bio: 'PhD in distributed systems' },
];

export default function AboutPage() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Building the <span className="text-primary">Agentic Economy</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Kuberna Labs is the infrastructure layer for autonomous AI agents operating across decentralized networks.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
                We believe the future of finance is agentic. Autonomous AI agents will manage treasuries, 
                execute trades, and provide financial services across blockchain networks. 
                But they need secure, decentralized infrastructure to operate.
              </p>
              <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
                Kuberna Labs provides that foundation: TEE-based secure execution, cross-chain intents, 
                and a marketplace for agentic services. We are building the operating system for the agentic economy.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-primary">$420M+</p>
                  <p className="text-sm text-on-surface-variant">TVL Secured</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">12K+</p>
                  <p className="text-sm text-on-surface-variant">Active Agents</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-primary">99.9%</p>
                  <p className="text-sm text-on-surface-variant">Uptime</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center text-center">
                <Globe size={32} className="text-primary mb-4" />
                <h3 className="font-bold">Global Network</h3>
                <p className="text-sm text-on-surface-variant">Distributed nodes worldwide</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center text-center">
                <Users size={32} className="text-secondary mb-4" />
                <h3 className="font-bold">Community First</h3>
                <p className="text-sm text-on-surface-variant">50K+ developer community</p>
              </div>
              <div className="bg-surface-container-low rounded-xl p-6 flex flex-col items-center text-center col-span-2">
                <Rocket size={32} className="text-primary mb-4" />
                <h3 className="font-bold">Mission Driven</h3>
                <p className="text-sm text-on-surface-variant">Democratizing financial infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Founding Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-surface rounded-xl p-6 text-center hover:-translate-y-2 transition-transform">
                <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4 text-on-primary font-bold text-2xl">
                  {member.name.charAt(0)}
                </div>
                <h3 className="font-bold mb-1">{member.name}</h3>
                <p className="text-sm text-primary mb-2">{member.title}</p>
                <p className="text-xs text-on-surface-variant">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Join the Revolution</h2>
          <p className="text-on-surface-variant mb-10">
            Building the agentic economy requires great minds. Come work with us.
          </p>
          <Link href="/careers" className="btn btn-primary px-12 py-4 text-lg inline-flex items-center gap-2">
            View Open Positions <ArrowRight size={20} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}