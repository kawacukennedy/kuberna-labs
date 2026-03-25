import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CourseCard } from '@/components/shared/CourseCard';
import { Search, Filter, BookOpen, Clock, Star, ChevronDown, Sparkles } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const courses = [
  { id: 1, title: "Introduction to Agentic Web3 Systems", instructor: "Prof. Sarah Chen", thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600", level: "Beginner", duration: "4h 15m" },
  { id: 2, title: "Advanced Multi-Chain Intent Engineering", instructor: "Dr. Alice Smith", thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600", level: "Advanced", duration: "12h 30m" },
  { id: 3, title: "Securing Agents with TEE & zkTLS", instructor: "Bob Johnson", thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600", level: "Intermediate", duration: "8h 15m" },
  { id: 4, title: "Building Cross-Chain Arbitrage Bots", instructor: "David Miller", thumbnail: "https://images.unsplash.com/photo-1611974708305-96dd0ba18d36?auto=format&fit=crop&q=80&w=600", level: "Advanced", duration: "15h" },
  { id: 5, title: "ElizaOS: The Definitive Developer Guide", instructor: "Michael Scott", thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600", level: "Intermediate", duration: "6h 45m" },
  { id: 6, title: "Decentralized Governance for AI Agents", instructor: "Emily Blunt", thumbnail: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&q=80&w=600", level: "Beginner", duration: "3h 20m" },
];

export default function CoursesPage() {
  const [activeLevel, setActiveLevel] = useState('ALL');

  const filteredCourses = activeLevel === 'ALL' 
    ? courses 
    : courses.filter(c => c.level.toUpperCase() === activeLevel);

  return (
    <Layout>
      {/* ── Page Header ── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface/30">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="max-w-4xl mx-auto"
        >
          <span className="section-badge mb-4"><Sparkles size={14} className="inline mr-1" /> Educational Excellence</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-heading">
            Expand Your <span className="gradient-text">Agentic</span> Knowledge
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            From beginners to advanced developers, learn to build and deploy production-grade autonomous agents on decentralized networks.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Course Filters */}
        <Section className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-16">
          <motion.div variants={fadeUp} className="flex bg-surface/80 backdrop-blur-sm p-1.5 rounded-2xl border border-glass-border shadow-sm overflow-x-auto max-w-full">
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
              <button 
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all whitespace-nowrap ${
                  activeLevel === level 
                    ? 'bg-white text-primary shadow-md' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {level}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-4 w-full lg:w-auto">
            <div className="flex-grow glass p-1.5 rounded-2xl flex items-center min-w-[320px] shadow-sm">
              <Search className="ml-3.5 text-text-secondary" size={18} />
              <input 
                type="text" 
                placeholder="Search by keyword or technology..." 
                className="bg-transparent border-none outline-none py-2 px-3 text-sm w-full font-medium"
              />
            </div>
            <button className="btn btn-glass px-6 text-sm font-bold flex items-center gap-2 shadow-sm">
              Sort <ChevronDown size={14} />
            </button>
          </motion.div>
        </Section>

        {/* Grid */}
        <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <motion.div key={course.id} variants={fadeUp}>
              <CourseCard {...course} />
            </motion.div>
          ))}
        </Section>
        
        {/* Instructor CTA */}
        <Section className="mt-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 rounded-[40px] -z-10" />
          <div className="glass p-12 md:p-16 rounded-[40px] text-center max-w-5xl mx-auto border-primary/10 shadow-glow">
            <motion.div variants={fadeUp} className="p-5 bg-gradient-to-br from-primary to-primary-dark text-white w-fit rounded-3xl mx-auto mb-8 shadow-lg">
              <BookOpen size={40} />
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold mb-6 font-heading tracking-tight">
              Want to teach on <span className="gradient-text">Kuberna Labs?</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-lg text-text-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Share your expertise with the next generation of Web3 founders and developers in the agentic economy. Build your community and earn revenue.
            </motion.p>
            <motion.div variants={fadeUp}>
              <button className="btn btn-primary px-12 py-4.5 font-bold tracking-tight text-lg shadow-xl shadow-primary/20">
                Become an Instructor
              </button>
            </motion.div>
          </div>
        </Section>
      </div>
    </Layout>
  );
}
