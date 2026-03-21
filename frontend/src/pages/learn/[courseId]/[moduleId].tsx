import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '@/components/layout/Layout';
import { ChevronLeft, ChevronRight, Play, BookOpen, CheckCircle2, MessageSquare, Download, Share2, HelpCircle } from 'lucide-react';

export default function LearnPage() {
  const router = useRouter();
  const { courseId, moduleId } = router.query;
  const [completed, setCompleted] = useState(false);

  return (
    <div className="min-h-screen flex flex-col pt-0">
      {/* Learn Header */}
      <nav className="glass sticky top-0 z-50 w-full px-6 h-16 flex items-center justify-between border-b border-glass-border">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 hover:bg-surface rounded-full">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-6 w-px bg-glass-border"></div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-[300px]">Advanced Multi-Chain Intent Engineering</h1>
            <p className="text-[10px] text-primary font-bold uppercase tracking-tight">Module 3: Implementation Workshop</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-widest">Progress</span>
            <div className="w-32 h-1.5 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '45%' }}></div>
            </div>
            <span className="text-xs font-bold">45%</span>
          </div>
          <button className="btn btn-primary py-2 px-6 text-xs font-bold uppercase tracking-widest shadow-lg">
             Next Module <ChevronRight size={14} />
          </button>
        </div>
      </nav>

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden h-[calc(100vh-64px)]">
        {/* Main Content: Video/Reader */}
        <div className="flex-grow flex flex-col overflow-auto bg-[#F8FAFC]">
          <div className="w-full aspect-video bg-black relative group">
            <img src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover opacity-60" alt="lesson" />
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="w-20 h-20 bg-primary/90 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
                <Play size={32} fill="currentColor" />
              </button>
            </div>
            
            <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/80 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <Play size={20} fill="currentColor" />
                     <div className="w-96 h-1 bg-white/30 rounded-full relative">
                        <div className="absolute left-0 top-0 h-full bg-primary rounded-full w-1/3"></div>
                     </div>
                     <span className="text-xs font-mono">12:34 / 45:00</span>
                  </div>
                  <HelpCircle size={20} />
               </div>
            </div>
          </div>

          <div className="p-12 max-w-4xl mx-auto w-full">
            <h2 className="text-3xl font-bold mb-6">Core Implementation Patterns for Multi-Chain Routers</h2>
            <div className="prose prose-slate max-w-none text-text-secondary leading-relaxed space-y-4">
               <p>In this lesson, we dive deep into the specific Solidity patterns required to build a robust intent router. We&apos;ll cover the security implications of delegating execution to solvers and how to protect against re-entrancy attacks in cross-chain environments.</p>
               <h3 className="text-xl font-bold text-text-primary mt-8">Key Concepts We&apos;ll Cover:</h3>
               <ul className="list-disc pl-6 space-y-2">
                 <li>Defining the Intent Struct for maximum interoperability.</li>
                 <li>Building the Escrow contract for secure value holding.</li>
                 <li>Implementing the Settlement logic for verified execution proofs.</li>
                 <li>Optimizing gas with EIP-712 typed data signatures.</li>
               </ul>
            </div>

            <div className="mt-12 flex gap-4">
               <button className="btn btn-glass px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
                  <Download size={18} /> Lesson Materials
               </button>
               <button className="btn btn-glass px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
                  <MessageSquare size={18} /> Discussion Forum
               </button>
            </div>
          </div>
        </div>

        {/* Sidebar: Syllabus */}
        <div className="w-full lg:w-96 border-l border-glass-border bg-white flex flex-col shrink-0">
          <div className="p-6 border-b border-glass-border">
             <h3 className="font-bold flex items-center gap-2">
               <BookOpen size={18} className="text-primary" /> Course Syllabus
             </h3>
          </div>
          <div className="flex-grow overflow-auto p-4 space-y-2">
            {[
              { id: 1, title: 'Foundations of Cross-Chain Intents', done: true, current: false },
              { id: 2, title: 'The Solver Ecosystem & Game Theory', done: true, current: false },
              { id: 3, title: 'Workshop: Implementing the Router', done: false, current: true },
              { id: 4, title: 'Integrating CCIP with Chainlink', done: false, current: false },
              { id: 5, title: 'Security Audit & Vulnerability Patterns', done: false, current: false },
              { id: 6, title: 'Final Quiz: Intent Certification', done: false, current: false },
            ].map((mod) => (
               <div 
                 key={mod.id}
                 className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all border ${mod.current ? 'bg-primary/5 border-primary shadow-sm' : 'hover:bg-surface border-transparent'}`}
               >
                 <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${mod.done ? 'bg-emerald-100 text-emerald-600' : mod.current ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}>
                   {mod.done ? <CheckCircle2 size={16} /> : <span className="text-xs font-bold">{mod.id}</span>}
                 </div>
                 <div className="min-w-0">
                   <h4 className={`text-sm font-bold truncate ${mod.current ? 'text-text-primary' : 'text-text-secondary'}`}>{mod.title}</h4>
                   <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest mt-0.5">25 mins &bull; {mod.id === 3 ? 'Workshop' : 'Video'}</p>
                 </div>
               </div>
            ))}
          </div>

          <div className="p-6 border-t border-glass-border bg-surface/50">
             <button 
               onClick={() => setCompleted(!completed)}
               className={`btn w-full py-4 text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${completed ? 'bg-emerald-500 text-white' : 'btn-primary'}`}
             >
               {completed ? <><CheckCircle2 size={18} /> Module Completed</> : 'Complete Module'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from 'next/link';
