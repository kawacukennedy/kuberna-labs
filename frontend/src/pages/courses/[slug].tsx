import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Clock, BookOpen, Award, Globe, Shield, Play, ChevronRight, Check, User, FileText, Code, Cpu } from 'lucide-react';

const curriculum = [
  { title: 'The Evolution of Cross-Chain Systems', duration: '45m', type: 'video' },
  { title: 'Understanding Intent-Based Architectures', duration: '1h 10m', type: 'video' },
  { title: 'Implementation Workshop: Writing the Router', duration: '2h 15m', type: 'lab' },
  { title: 'Practical CCIP Integration', duration: '1h 45m', type: 'video' },
  { title: 'Quiz: Cross-Chain Communication Protocol', duration: '15m', type: 'quiz' },
];

const learningObjectives = [
  'Explain foundational cross-chain communication patterns',
  'Build custom intent routing strategies with Solidity',
  'Integrate with Chainlink CCIP and Wormhole',
  'Implement advanced security best practices for intent-based systems',
  'Optimize gas costs for complex cross-chain operations',
  'Deploy and monitor intents across production networks',
];

export default function CourseDetailPage() {
  const router = useRouter();
  const { slug } = router.query;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-8">
          <Link href="/courses" className="hover:text-primary">Courses</Link>
          <ChevronRight size={12} />
          <span className="text-on-surface">Advanced Multi-Chain Intent Engineering</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Advanced Multi-Chain Intent Engineering
            </h1>
            <p className="text-xl text-on-surface-variant mb-12">
              Master the art of creating robust cross-chain intents that route automatically across various decentralized networks with maximum efficiency.
            </p>

            <div className="flex flex-wrap gap-8 mb-12 py-6 border-y border-outline/10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-container rounded-lg">
                  <User size={20} className="text-on-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Instructor</p>
                  <p className="text-sm font-bold">Dr. Alice Smith</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary-container rounded-lg">
                  <Clock size={20} className="text-on-secondary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Duration</p>
                  <p className="text-sm font-bold">12h 30m Total</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-tertiary-container rounded-lg">
                  <Globe size={20} className="text-on-tertiary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Language</p>
                  <p className="text-sm font-bold">English</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-fixed-dim rounded-lg">
                  <Award size={20} className="text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant">Certification</p>
                  <p className="text-sm font-bold">NFT Certificate</p>
                </div>
              </div>
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Learning Objectives</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learningObjectives.map((obj, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <Check size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                    <p>{obj}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6">Course Syllabus</h2>
              <div className="space-y-4">
                {curriculum.map((mod, i) => (
                  <div key={i} className="bg-surface-container-low p-5 rounded-xl flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-surface rounded-full flex items-center justify-center text-on-surface-variant">
                        <Play size={16} fill="currentColor" />
                      </div>
                      <div>
                        <h4 className="font-bold">Module {i+1}: {mod.title}</h4>
                        <p className="text-xs text-on-surface-variant uppercase tracking-widest font-bold mt-1">
                          {mod.duration} &bull; {mod.type}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-on-surface-variant" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: Enrollment Card */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-low p-8 rounded-xl sticky top-24">
              <div className="w-full h-48 bg-surface rounded-lg mb-6">
                <img 
                  src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600" 
                  alt="Course"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>
              
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant block mb-2">Price</span>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold text-on-surface">$199</h3>
                  <p className="text-sm text-on-surface-variant uppercase tracking-tight">or 0.08 ETH</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <button className="btn btn-primary w-full py-4 text-lg">
                  Enroll in Course
                </button>
                <button className="btn btn-glass w-full py-4 text-lg">
                  Add to Wishlist
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest text-center mb-4">Includes</p>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md">
                    <BookOpen size={14} />
                  </div>
                  12 High-definition modules
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md">
                    <Code size={14} />
                  </div>
                  Hands-on IDE labs
                </div>
                <div className="flex items-center gap-3 text-sm font-medium">
                  <div className="p-1 bg-surface rounded-md">
                    <Award size={14} />
                  </div>
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