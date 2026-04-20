import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe, Code, CheckCircle, Building2, ChevronRight } from 'lucide-react';

const features = [
  { icon: Shield, title: 'Enterprise-Grade TEE', description: 'Deploy agents in Intel TDX / AMD SEV enclaves with on-chain remote attestation.' },
  { icon: Zap, title: 'Dedicated Compute', description: 'Reserved capacity with guaranteed performance SLAs and 24/7 support.' },
  { icon: Globe, title: 'Custom Networks', description: 'Private cross-chain bridges and custom intent routing for your protocols.' },
  { icon: Code, title: 'API Access', description: 'Full programmatic access to our SDK with dedicated rate limits.' },
];

const cases = [
  { title: 'DeFi Protocol Automation', company: 'Aavegon', result: '3x faster settlements' },
  { title: 'Institutional Custody', company: 'BitGo', result: '$500M secured' },
  { title: 'DAO Treasury', company: 'MakerDAO', result: '40% cost reduction' },
];

export default function EnterprisePage() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-fixed/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest mb-6 inline-flex">
            Enterprise Solutions
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Scale with <span className="text-primary">Confidence</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto mb-10">
            Dedicated infrastructure for enterprises building the agentic economy. Custom deployments, SLA guarantees, and dedicated support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/contact" className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto flex items-center gap-2">
              Contact Sales <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div key={f.title} className="bg-surface-container-low rounded-xl p-8 hover:bg-surface-container transition-colors">
                <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center mb-6">
                  <f.icon size={24} className="text-on-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-on-surface-variant">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Industry Leaders</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Enterprise teams rely on Kuberna Labs for mission-critical deployments.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cases.map((c) => (
              <div key={c.title} className="bg-surface rounded-xl p-8">
                <Building2 size={32} className="text-primary mb-4" />
                <h3 className="text-lg font-bold mb-2">{c.title}</h3>
                <p className="text-sm text-on-surface-variant mb-4">{c.company}</p>
                <p className="text-xl font-bold text-secondary">{c.result}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-on-surface-variant mb-10">
            Schedule a demo with our enterprise team to discuss your requirements.
          </p>
          <Link href="/contact" className="btn btn-primary px-12 py-4 text-lg inline-flex items-center gap-2">
            Talk to Sales <ChevronRight size={20} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}