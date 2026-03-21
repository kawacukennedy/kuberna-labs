import React from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { Clock, BookOpen, Star, User, ChevronRight, Play, CheckCircle2, ShieldCheck, Globe, Cpu } from 'lucide-react';

export default function CourseDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-text-secondary uppercase tracking-widest mb-8">
          <Link href="/courses">Courses</Link>
          <ChevronRight size={12} />
          <span className="text-text-primary">Advanced Multi-Chain Intent Engineering</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">Advanced Multi-Chain Intent Engineering</h1>
            <p className="text-xl text-text-secondary mb-12">Master the art of creating robust cross-chain intents that route automatically across various decentralized networks with maximum efficiency.</p>

            <div className="flex flex-wrap gap-8 mb-12 py-6 border-y border-glass-border">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><User size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Instructor</p>
                  <p className="text-sm font-bold">Dr. Alice Smith</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl"><Clock size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Duration</p>
                  <p className="text-sm font-bold">12h 30m Total</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 text-amber-600 rounded-xl"><Globe size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Language</p>
                  <p className="text-sm font-bold">English</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-xl"><ShieldCheck size={20} /></div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-text-secondary tracking-widest">Certification</p>
                  <p className="text-sm font-bold">NFT Certificate</p>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Learning Objectives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Explain foundational cross-chain communication patterns',
                  'Build custom intent routing strategies with Solidity',
                  'Integrate with Chainlink CCIP and Wormhole',
                  'Implement advanced security best practices for intent-based systems',
                  'Optimize gas costs for complex cross-chain operations',
                  'Deploy and monitor intents across production networks'
                ].map((obj, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <CheckCircle2 size={18} className="text-emerald-500 mt-0.5" />
                    <p>{obj}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
              <div className="space-y-4">
                {[
                  { title: 'The Evolution of Cross-Chain Systems', dur: '45m', type: 'video' },
                  { title: 'Understanding Intent-Based Architectures', dur: '1h 10m', type: 'video' },
                  { title: 'Implementation Workshop: Writing the Router', dur: '2h 15m', type: 'lab' },
                  { title: 'Practical CCIP Integration', dur: '1h 45m', type: 'video' },
                  { title: 'Quiz: Cross-Chain Communication Protocol', dur: '15m', type: 'quiz' },
                ].map((mod, i) => (
                  <div key={i} className="glass p-5 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface transition-colors border border-transparent hover:border-glass-border">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                        <Play size={16} fill="currentColor" />
                      </div>
                      <div>
                        <h4 className="font-bold">Module {i+1}: {mod.title}</h4>
                        <p className="text-xs text-text-secondary uppercase tracking-widest font-bold mt-1">
                          {mod.dur} &bull; {mod.type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-text-secondary" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar Area: Buy Card */}
          <div className="lg:col-span-1">
            <div className="glass p-8 rounded-[40px] sticky top-32">
              <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600" className="w-full h-48 object-cover rounded-3xl mb-8" alt="course" />
              
              <div className="mb-8">
                <span className="text-xs font-bold text-text-secondary uppercase tracking-widest block mb-2">Price</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold text-text-primary">$199.00</h3>
                  <p className="text-sm text-text-secondary font-medium uppercase tracking-tight">or 0.08 ETH</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <button className="btn btn-primary w-full py-4 text-lg">Enroll in Course</button>
                <button className="btn btn-glass w-full py-4 text-lg">Add to Wishlist</button>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest text-center mb-4">Includes</p>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md"><BookOpen size={14} /></div>
                  12 High-definition modules
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md"><Cpu size={14} /></div>
                  Hands-on IDE labs
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md"><ShieldCheck size={14} /></div>
                  On-chain NFT certificate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import Link from 'next/link';
