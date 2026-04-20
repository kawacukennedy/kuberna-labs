import React from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { ArrowForward, Globe, Zap, Code, Briefcase, MapPin } from 'lucide-react';

const jobs = [
  { title: 'Senior Protocol Engineer', type: 'Engineering', location: 'Remote', tags: ['Rust', 'Solidity'] },
  { title: 'AI/ML Engineer', type: 'Engineering', location: 'Remote', tags: ['Python', 'LLMs'] },
  { title: 'Developer Advocate', type: 'Marketing', location: 'Remote', tags: ['Technical', 'Content'] },
  { title: 'Solutions Architect', type: 'Sales', location: 'New York', tags: ['Enterprise', 'DeFi'] },
];

export default function CareersPage() {
  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-fixed/10 via-transparent to-transparent" />
        <div className="max-w-4xl mx-auto">
          <span className="px-4 py-1.5 rounded-full bg-primary-container text-on-primary font-bold text-xs uppercase tracking-widest mb-6 inline-flex">
            Careers
          </span>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Build the <span className="text-primary">Agentic Economy</span>
          </h1>
          <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">
            Join a team building the infrastructure for autonomous AI agents. Remote-first, competitive equity, and meaningful work.
          </p>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-surface-container-low rounded-xl p-6 text-center">
              <Globe size={32} className="text-primary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Work Anywhere</h3>
              <p className="text-sm text-on-surface-variant">Remote-first team. Async by default.</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-6 text-center">
              <Zap size={32} className="text-secondary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Competitive Equity</h3>
              <p className="text-sm text-on-surface-variant">Significant ownership stake.</p>
            </div>
            <div className="bg-surface-container-low rounded-xl p-6 text-center">
              <Code size={32} className="text-tertiary mx-auto mb-4" />
              <h3 className="font-bold text-lg mb-2">Cutting Edge</h3>
              <p className="text-sm text-on-surface-variant">TEE, ZK, and AI tech.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.title} className="bg-surface-container-low rounded-xl p-6 flex items-center justify-between hover:bg-surface-container transition-colors">
                <div>
                  <h3 className="font-bold text-lg">{job.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-on-surface-variant">
                    <span>{job.type}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} /> {job.location}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {job.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-surface px-2 py-1 rounded">{tag}</span>
                    ))}
                  </div>
                </div>
                <button className="btn btn-glass px-6 py-3">
                  Apply <ArrowForward size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-surface-container-low">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Don&apos;t see the right role?</h2>
          <p className="text-on-surface-variant mb-8">
            We&apos;re always looking for exceptional talent. Send us your resume and we&apos;ll keep you in mind for future roles.
          </p>
          <Link href="mailto:careers@kuberna.labs" className="btn btn-primary px-12 py-4">
            Email Us
          </Link>
        </div>
      </section>
    </Layout>
  );
}