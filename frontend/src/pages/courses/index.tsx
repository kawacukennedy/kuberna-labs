import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CourseCard } from '@/components/shared/CourseCard';
import { Search, Filter, BookOpen, Clock, Star, ChevronDown } from 'lucide-react';

export default function CoursesPage() {
  const [activeLevel, setActiveLevel] = useState('ALL');

  return (
    <Layout>
      <section className="py-20 bg-surface px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Expand Your <span className="text-primary italic">Agentic</span> Knowledge</h1>
          <p className="text-xl text-text-secondary max-w-2xl mx-auto">
            From beginners to advanced developers, learn to build and deploy production-grade autonomous agents.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Course Filters */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
          <div className="flex bg-surface p-1 rounded-2xl border border-glass-border">
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
              <button 
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeLevel === level ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                {level}
              </button>
            ))}
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <div className="flex-grow glass p-1.5 rounded-2xl flex items-center min-w-[300px]">
              <Search className="ml-3 text-text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="bg-transparent border-none outline-none py-1.5 px-3 text-sm w-full"
              />
            </div>
            <button className="btn btn-glass px-6 text-sm font-semibold flex items-center gap-2">
              Sort By <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <CourseCard 
            title="Introduction to Agentic Web3 Systems"
            instructor="Prof. Sarah Chen"
            thumbnail="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600"
            level="Beginner"
            duration="4h 15m"
          />
          <CourseCard 
            title="Advanced Multi-Chain Intent Engineering"
            instructor="Dr. Alice Smith"
            thumbnail="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600"
            level="Advanced"
            duration="12h 30m"
          />
          <CourseCard 
            title="Securing Agents with TEE & zkTLS"
            instructor="Bob Johnson"
            thumbnail="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600"
            level="Intermediate"
            duration="8h 15m"
          />
          <CourseCard 
             title="Building Cross-Chain Arbitrage Bots"
             instructor="David Miller"
             thumbnail="https://images.unsplash.com/photo-1611974708305-96dd0ba18d36?auto=format&fit=crop&q=80&w=600"
             level="Advanced"
             duration="15h"
          />
          <CourseCard 
             title="ElizaOS: The Definitive Developer Guide"
             instructor="Michael Scott"
             thumbnail="https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600"
             level="Intermediate"
             duration="6h 45m"
          />
          <CourseCard 
             title="Decentralized Governance for AI Agents"
             instructor="Emily Blunt"
             thumbnail="https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&q=80&w=600"
             level="Beginner"
             duration="3h 20m"
          />
        </div>
        
        <div className="mt-20 glass p-12 rounded-[40px] text-center max-w-4xl mx-auto">
          <div className="p-4 bg-primary/10 text-primary w-fit rounded-3xl mx-auto mb-6">
            <BookOpen size={40} />
          </div>
          <h2 className="text-3xl font-bold mb-4">Want to teach on Kuberna Labs?</h2>
          <p className="text-text-secondary mb-8">Share your expertise with thousands of developers and founders in the agentic economy.</p>
          <button className="btn btn-primary px-10 py-4 font-bold tracking-tight">Become an Instructor</button>
        </div>
      </div>
    </Layout>
  );
}
