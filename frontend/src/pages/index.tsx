import React, { useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  BookOpen,
  Bot,
  Link2,
  Shield,
  VisibilityOff,
  Dns,
  ArrowForward,
  CheckCircle,
  Star,
  PlayCircle
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.175, 0.885, 0.32, 1.275] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
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

const features = [
  { icon: BookOpen, title: 'Learn by Building', description: 'Hands‑on courses designed to take you from concept to deployed agent.', color: 'bg-primary-container text-on-primary' },
  { icon: Bot, title: 'Autonomous Agents', description: 'Create sophisticated agents that reason, plan, and execute complex workflows.', color: 'bg-primary-container text-on-primary' },
  { icon: Link2, title: 'Cross‑Chain Intents', description: 'Execute multi‑chain strategies seamlessly without dealing with bridge friction.', color: 'bg-primary-container text-on-primary' },
  { icon: Shield, title: 'Trusted Execution', description: 'Deploy securely within Trusted Execution Environments (TEEs).', color: 'bg-secondary-container text-on-secondary' },
  { icon: VisibilityOff, title: 'Zero‑Knowledge', description: 'Access and compute on private off‑chain data securely using ZK proofs.', color: 'bg-secondary-container text-on-secondary' },
  { icon: Dns, title: 'Decentralized Compute', description: 'Run workloads on decentralized networks for unstoppable uptime.', color: 'bg-secondary-container text-on-secondary' },
];

const steps = [
  { num: 1, title: 'Learn', desc: 'Master the primitives of AI and Web3 integration through structured modules.' },
  { num: 2, title: 'Build', desc: 'Construct your agent logic using our comprehensive SDK and templates.' },
  { num: 3, title: 'Deploy', desc: 'Launch securely onto decentralized compute nodes with one command.' },
  { num: 4, title: 'Earn', desc: 'Monetize your agents actions across protocols and intent networks.' },
];

const tiers = [
  {
    name: 'SDK',
    price: '$397',
    period: '',
    features: ['Agent SDK access', '5h video course', '3 deployment templates', 'Community support'],
    cta: 'Get Access',
    highlighted: false,
  },
  {
    name: 'Accelerator',
    price: '$25,000',
    period: '',
    features: ['12‑week cohort program', '1:1 technical mentorship', 'Model fine‑tuning support', 'Cross‑chain integration', 'Elite peer network'],
    cta: 'Apply Now',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$150k',
    period: '/yr',
    features: ['Full TEE deployment', 'zkTLS integration', 'Dedicated 24/7 support', 'On‑site strategy retreat', 'Custom tokenomics design'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: 'Kuberna Labs accelerated our DeFi protocol\'s automation by months. The SDK is incredibly intuitive while providing the deep control our smart contracts require.',
    name: 'Alice M.',
    title: 'Founder, Aavegon',
    initials: 'A',
  },
  {
    quote: 'The TEE deployment gave our institutional clients the security they demanded. We could not have launched our agentic trading desk without Kuberna\'s infrastructure.',
    name: 'Bob K.',
    title: 'CTO, FinTec',
    initials: 'B',
  },
];

export default function LandingPage() {
  return (
    <Layout>
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-surface-container-low px-6 pt-24">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-primary-fixed-dim/30 blur-[100px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-secondary-fixed-dim/20 blur-[100px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.175, 0.885, 0.32, 1.275] }}
          className="relative z-10 max-w-5xl mx-auto text-center flex flex-col items-center"
        >
          <span className="px-4 py-1.5 rounded-full bg-surface-container text-primary font-bold text-xs uppercase tracking-widest mb-8 border border-outline/20 inline-flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            Agentic Computing Environment
          </span>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 leading-[1.1]">
            Architect the Agentic<br /><span className="text-primary">Web3 Enterprise</span>
          </h1>

          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-12">
            Build, deploy, and monetize autonomous AI agents on decentralized infrastructure. Secure, scalable, and fully sovereign.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
            <Link href="/auth/register" className="w-full sm:w-auto px-8 py-4 rounded-full bg-primary text-white font-semibold text-lg spring-hover shadow-ambient flex items-center justify-center gap-2">
              Start Building <ArrowForward size={20} />
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full glass-panel text-on-surface font-semibold text-lg border border-outline/20 spring-hover shadow-ambient flex items-center justify-center gap-2">
              Watch Demo <PlayCircle size={20} />
            </button>
          </div>
        </motion.div>
      </Section>

      <Section className="py-24 px-6 md:px-12 bg-surface relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-on-surface mb-4">Core Capabilities</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">The foundational primitives for the next generation of decentralized automation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} className="bg-surface-container-low rounded-xl p-8 flex flex-col items-start hover:bg-surface transition-colors duration-300">
                <div className={`w-12 h-12 rounded-lg ${f.color} flex items-center justify-center mb-6 shadow-ambient`}>
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-medium text-on-surface mb-3">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-24 px-6 md:px-12 bg-surface-container-low">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-on-surface mb-6">The Agent Deployment Lifecycle</h2>
              <p className="text-on-surface-variant mb-10 text-lg">A streamlined pipeline from conceptualization to revenue generation.</p>

              <div className="space-y-8">
                {steps.map((step) => (
                  <motion.div key={step.num} variants={fadeUp} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">{step.num}</div>
                    <div>
                      <h4 className="text-lg font-medium text-on-surface mb-1">{step.title}</h4>
                      <p className="text-sm text-on-surface-variant">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2">
              <div className="rounded-xl overflow-hidden shadow-ambient border border-outline/20 relative aspect-square bg-surface">
                <div className="absolute inset-0 bg-gradient-to-tr from-surface/80 to-transparent z-10" />
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section className="py-24 px-6 md:px-12 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-on-surface mb-4">Ecosystem Access</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Choose the tier that matches your deployment scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {tiers.map((tier) => (
              <motion.div
                key={tier.name}
                variants={fadeUp}
                className={`rounded-xl p-8 border flex flex-col h-full ${
                  tier.highlighted
                    ? 'bg-surface-container-high border-primary/30 shadow-ambient transform md:-translate-y-4'
                    : 'bg-surface-container-low border-outline/20'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-medium text-on-surface mb-2">{tier.name}</h3>
                <div className="text-4xl font-bold text-on-surface mb-6">
                  {tier.price}
                  {tier.period && <span className="text-lg text-on-surface-variant font-normal">{tier.period}</span>}
                </div>
                <ul className="space-y-4 mb-8 flex-grow">
                  {tier.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-on-surface-variant">
                      <CheckCircle size={16} className="text-primary flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-3 rounded-full font-medium ${tier.highlighted ? 'bg-primary text-white' : 'bg-surface text-primary hover:bg-surface-variant transition-colors'}`}>
                  {tier.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="py-24 px-6 md:px-12 bg-surface-container-low overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-on-surface mb-4">Protocol Partners</h2>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp} className="min-w-[300px] md:min-w-[400px] bg-surface rounded-xl p-8 shadow-ambient border border-outline/20">
                <div className="flex items-center gap-1 mb-6 text-tertiary-fixed-dim">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill="currentColor" />
                  ))}
                </div>
                <p className="text-on-surface-variant mb-8 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold">
                    {t.initials}
                  </div>
                  <div>
                    <div className="font-medium text-on-surface">{t.name}</div>
                    <div className="text-xs text-on-surface-variant">{t.title}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Section>
    </Layout>
  );
}