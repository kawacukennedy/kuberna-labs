import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CourseCard } from '@/components/shared/CourseCard';
import { Search, SlidersHorizontal, Grid, List, Sparkles } from 'lucide-react';
import { motion, useInView } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] } },
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
  { id: 1, title: "Introduction to Agentic Web3 Systems", instructor: "Prof. Sarah Chen", thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600", level: "Beginner", duration: "4h 15m", price: 0 },
  { id: 2, title: "Advanced Multi-Chain Intent Engineering", instructor: "Dr. Alice Smith", thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600", level: "Advanced", duration: "12h 30m", price: 199 },
  { id: 3, title: "Securing Agents with TEE & zkTLS", instructor: "Bob Johnson", thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600", level: "Intermediate", duration: "8h 15m", price: 149 },
  { id: 4, title: "Building Cross-Chain Arbitrage Bots", instructor: "David Miller", thumbnail: "https://images.unsplash.com/photo-1611974708305-96dd0ba18d36?auto=format&fit=crop&q=80&w=600", level: "Advanced", duration: "15h", price: 249 },
  { id: 5, title: "ElizaOS: The Definitive Developer Guide", instructor: "Michael Scott", thumbnail: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&q=80&w=600", level: "Intermediate", duration: "6h 45m", price: 99 },
  { id: 6, title: "Decentralized Governance for AI Agents", instructor: "Emily Blunt", thumbnail: "https://images.unsplash.com/photo-1516110833967-0b5716ca1387?auto=format&fit=crop&q=80&w=600", level: "Beginner", duration: "3h 20m", price: 0 },
];

export default function CoursesPage() {
  const [activeLevel, setActiveLevel] = useState('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredCourses = activeLevel === 'ALL' 
    ? courses 
    : courses.filter(c => c.level.toUpperCase() === activeLevel);

  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-16 px-6 text-center bg-surface">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-fixed/10 via-transparent to-transparent" />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="max-w-4xl mx-auto"
        >
          <span className="px-4 py-1.5 rounded-full bg-surface-container text-primary font-bold text-xs uppercase tracking-widest mb-6 inline-flex items-center gap-2">
            <Sparkles size={14} className="inline" /> Educational Excellence
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Explore <span className="text-primary">Courses</span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto">
            From beginners to advanced developers, learn to build and deploy production-grade autonomous agents on decentralized networks.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Section className="flex flex-col lg:flex-row justify-between items-center gap-8 mb-12">
          <motion.div variants={fadeUp} className="flex gap-2">
            {['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'].map((level) => (
              <button 
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  activeLevel === level 
                    ? 'bg-primary text-white shadow-glow' 
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {level}
              </button>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-4 w-full lg:w-auto">
            <div className="relative flex-grow lg:flex-grow-0 lg:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
              <input 
                type="text" 
                placeholder="Search courses..." 
                className="w-full pl-12 pr-4 py-3 bg-surface-container-low border border-outline/10 rounded-lg text-on-surface focus:ring-0 focus:bg-surface-container focus:shadow-glow transition-all"
              />
            </div>
            <button className="p-3 bg-surface-container-low border border-outline/10 rounded-lg hover:bg-surface-container transition-colors">
              <SlidersHorizontal size={18} className="text-on-surface-variant" />
            </button>
            <div className="flex gap-1 p-1 bg-surface-container-low rounded-lg">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}
              >
                <Grid size={18} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-surface text-primary' : 'text-on-surface-variant'}`}
              >
                <List size={18} />
              </button>
            </div>
          </motion.div>
        </Section>

        <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCourses.map((course) => (
            <motion.div key={course.id} variants={fadeUp}>
              <CourseCard {...course} />
            </motion.div>
          ))}
        </Section>
      </div>
    </Layout>
  );
}