import React, { useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Shield, Zap, Globe, Cpu, ArrowRight, CheckCircle2,
  BookOpen, Bot, Link2, Lock, Server, Sparkles,
  Star, Quote
} from 'lucide-react';

/* ── Animation helpers ── */
const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] } },
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

/* ── Data ── */
const features = [
  { icon: BookOpen, title: 'Learn by Building', description: 'Hands‑on courses with live workshops, coding labs, and a world‑class SDK.', color: 'from-primary to-primary-dark' },
  { icon: Bot, title: 'Autonomous Agents', description: 'Create agents that reason, act, and earn revenue across decentralized networks.', color: 'from-secondary to-secondary-dark' },
  { icon: Link2, title: 'Cross‑Chain Intents', description: 'Execute complex multi‑chain swaps and DeFi operations via intent protocols.', color: 'from-primary-light to-primary' },
  { icon: Shield, title: 'Trusted Execution', description: 'Deploy in Intel TDX / AMD SEV enclaves with on‑chain remote attestation.', color: 'from-accent to-accent-dark' },
  { icon: Lock, title: 'Zero‑Knowledge Privacy', description: 'Access private Web2 data with Reclaim Protocol and zkPass — no exposure.', color: 'from-primary-dark to-primary' },
  { icon: Server, title: 'Decentralized Compute', description: 'Run on Akash, Phala, and Hyperbolic for up to 50% lower cost.', color: 'from-secondary-dark to-secondary' },
];

const steps = [
  { num: 1, title: 'Learn', desc: 'Take courses and master agent development with our hands‑on curriculum.' },
  { num: 2, title: 'Build', desc: 'Create agents using our browser IDE and production‑grade SDK.' },
  { num: 3, title: 'Deploy', desc: 'Run on cloud or TEE with one click — across any blockchain.' },
  { num: 4, title: 'Earn', desc: 'Post tasks or let your agents work the marketplace autonomously.' },
];

const tiers = [
  {
    name: 'SDK',
    price: '$397',
    period: 'one-time',
    features: ['Agent SDK (TS + Python)', '5 hours of video content', '3 production templates', 'Community forum access', 'Certificate of completion'],
    cta: 'Buy Now',
    href: '/courses',
    highlighted: false,
  },
  {
    name: 'Accelerator',
    price: '$25,000',
    period: '12-week cohort',
    features: ['Everything in SDK', '1:1 weekly mentorship', 'Fine‑tuning workshop', 'Cross‑chain mastery', 'Peer founder network', 'Live workshop access'],
    cta: 'Apply Now',
    href: '/auth/register',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$150,000',
    period: 'per year',
    features: ['Everything in Accelerator', 'TEE deployment included', 'zkTLS integration', 'Dedicated support engineer', 'On‑site strategy retreat', 'Custom tokenomics design'],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false,
  },
];

const testimonials = [
  {
    quote: 'Kuberna Labs accelerated our DeFi protocol\'s automation by months. The TEE deployment gave our institutional clients the security they demanded.',
    name: 'Alice M.',
    title: 'Founder, Aavegon Protocol',
    initials: 'AM',
  },
  {
    quote: 'The cross‑chain intent marketplace is game changing. Our agents now execute multi‑chain swaps in under 30 seconds, completely autonomously.',
    name: 'Bob K.',
    title: 'CTO, FinTec Labs',
    initials: 'BK',
  },
  {
    quote: 'As a solo developer, the SDK and courses transformed me from a Web2 dev into someone deploying production agents on NEAR within weeks.',
    name: 'Chloé D.',
    title: 'Independent Developer',
    initials: 'CD',
  },
];

/* ── Page ── */
export default function LandingPage() {
  return (
    <Layout>
      {/* ════════ HERO ════════ */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/8 rounded-full blur-[140px]" />
          <div className="absolute top-20 right-[10%] w-[300px] h-[300px] bg-secondary/6 rounded-full blur-[100px]" />
          <div className="absolute bottom-10 left-[15%] w-[200px] h-[200px] bg-accent/6 rounded-full blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <span className="section-badge mb-6 inline-block">
            <Sparkles size={14} className="inline -mt-0.5 mr-1.5" />
            The Agentic Economy is Here
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]">
            Architecting the{' '}
            <span className="gradient-text">Agentic</span>{' '}
            Web3 Enterprise
          </h1>

          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
            Build, deploy, and monetize autonomous AI agents operating across decentralized networks — with cross‑chain intents, TEE security, and zero‑knowledge privacy.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/register" className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto">
              Start Building Free
            </Link>
            <Link href="/docs" className="btn btn-glass px-10 py-4 text-lg w-full sm:w-auto flex items-center gap-2">
              View Documentation <ArrowRight size={20} />
            </Link>
          </div>
        </motion.div>

        {/* Hero illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 0.61, 0.36, 1] }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none rounded-3xl" />
            <img
              src="/images/hero-illustration.png"
              alt="AI agents operating across decentralized blockchain networks"
              className="w-full rounded-3xl shadow-2xl border border-glass-border"
            />
          </div>
        </motion.div>
      </section>

      {/* ════════ STATS ════════ */}
      <Section className="py-12 px-6">
        <motion.div variants={fadeUp} className="max-w-5xl mx-auto glass rounded-3xl p-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '$420M+', label: 'TVL Secured' },
            { value: '12K+', label: 'Active Agents' },
            { value: '50K+', label: 'Developers' },
            { value: '99.9%', label: 'TEE Uptime' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <h3 className="text-3xl md:text-4xl font-bold gradient-text mb-1 font-heading">{stat.value}</h3>
              <p className="text-xs text-text-secondary uppercase font-bold tracking-[0.15em]">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </Section>

      {/* ════════ FEATURES GRID ════════ */}
      <Section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="section-badge mb-4">Platform Capabilities</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 font-heading">
            The Agentic <span className="gradient-text">Operating System</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Production-grade infrastructure combined with a hands-on learning environment for the next generation of intelligent systems.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <motion.div key={f.title} variants={fadeUp} className="glass glass-card flex flex-col items-start gap-4">
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-xl font-bold font-heading">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ HOW IT WORKS ════════ */}
      <Section className="py-24 px-6 bg-surface/40">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="section-badge mb-4">Getting Started</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 font-heading">
            From Zero to <span className="gradient-text">Revenue</span> in 4 Steps
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            Our streamlined workflow takes you from learning the fundamentals to deploying revenue‑generating agents.
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <motion.div key={step.num} variants={fadeUp} className="relative text-center group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center text-2xl font-bold mx-auto mb-5 shadow-lg group-hover:shadow-xl transition-shadow font-heading">
                {step.num}
              </div>
              {step.num < 4 && (
                <div className="hidden md:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-0.5 bg-gradient-to-r from-primary/30 to-primary/10" />
              )}
              <h3 className="text-xl font-bold mb-2 font-heading">{step.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ EDUCATION ════════ */}
      <Section className="py-24 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div variants={fadeUp} className="relative">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-primary/15 rounded-full blur-[60px]" />
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary/15 rounded-full blur-[50px]" />
            <img
              src="/images/education-illustration.png"
              alt="AI agents working across blockchain networks"
              className="rounded-[32px] shadow-2xl relative z-10 border border-glass-border"
            />
            <motion.div
              variants={fadeUp}
              className="absolute -bottom-6 -right-6 glass p-5 rounded-2xl shadow-xl z-20"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-secondary to-secondary-dark text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-secondary uppercase tracking-[0.12em]">Course Progress</p>
                  <p className="text-lg font-bold font-heading">85% Complete</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} className="space-y-8">
            <span className="section-badge">Knowledge is Power</span>
            <h2 className="text-4xl md:text-5xl font-bold leading-[1.1] tracking-tight font-heading">
              Master the{' '}
              <span className="gradient-text">Agentic Economy</span>
            </h2>
            <p className="text-lg text-text-secondary leading-relaxed">
              Kuberna Labs isn&apos;t just a platform; it&apos;s a university for the next generation of Web3 founders. Learn how to architect, secure, and monetize autonomous agents through our comprehensive curriculum.
            </p>
            <ul className="space-y-4">
              {[
                'Interacting with Cross-Chain Liquidity',
                'Implementing TEE-based Private Key Management',
                'Advanced Intent Routing & Settlement Logic',
                'Agent Monetization Strategies',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-semibold">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center flex-shrink-0">
                    <ArrowRight size={14} />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/courses" className="btn btn-primary px-10 py-4 font-bold tracking-tight inline-flex items-center gap-2">
              Browse Courses <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </Section>

      {/* ════════ PRICING ════════ */}
      <Section className="py-24 px-6 bg-surface/40">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="section-badge mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 font-heading">
            Invest in Your <span className="gradient-text">Agent Future</span>
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto text-lg">
            From individual developers to enterprise teams — choose the path that accelerates your journey.
          </p>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              className={`glass rounded-[28px] p-8 flex flex-col ${tier.highlighted ? 'pricing-highlighted md:-mt-4 md:mb-4 md:py-12' : ''}`}
            >
              <h3 className="text-lg font-bold text-text-secondary uppercase tracking-wider mb-2 font-heading">{tier.name}</h3>
              <div className="mb-6">
                <span className="text-4xl md:text-5xl font-bold font-heading">{tier.price}</span>
                <span className="text-sm text-text-secondary ml-2">/ {tier.period}</span>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 size={18} className="text-secondary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={tier.href}
                className={`btn w-full py-3.5 text-center ${tier.highlighted ? 'btn-primary' : 'btn-glass'}`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ TESTIMONIALS ════════ */}
      <Section className="py-24 px-6">
        <motion.div variants={fadeUp} className="text-center mb-16">
          <span className="section-badge mb-4">What People Say</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-5 font-heading">
            Trusted by <span className="gradient-text">Builders</span> Worldwide
          </h2>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <motion.div key={t.name} variants={fadeUp} className="testimonial-card flex flex-col">
              <Quote size={32} className="text-primary/20 mb-4" />
              <p className="text-sm leading-relaxed text-text-secondary mb-6 flex-grow">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 pt-4 border-t border-glass-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-sm font-bold font-heading">
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold">{t.name}</p>
                  <p className="text-xs text-text-secondary">{t.title}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ════════ CTA ════════ */}
      <Section className="py-24 px-6">
        <motion.div
          variants={fadeUp}
          className="max-w-5xl mx-auto rounded-[40px] overflow-hidden relative"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-primary-light" />
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          />

          <div className="relative z-10 p-12 md:p-16 text-center text-white">
            <div className="absolute top-8 right-8 opacity-10">
              <Cpu size={180} />
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight leading-[1.05] font-heading">
              Start Building the<br />Future Today
            </h2>
            <p className="text-lg opacity-80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of founders and enterprises already architecting the agentic economy on Kuberna Labs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth/register" className="btn bg-white text-primary px-10 py-4 text-lg hover:bg-opacity-90 w-full sm:w-auto shadow-lg font-heading font-bold">
                Launch Console
              </Link>
              <Link href="/contact" className="btn bg-white/10 border border-white/20 text-white px-10 py-4 text-lg hover:bg-white/20 w-full sm:w-auto font-heading">
                Contact Enterprise
              </Link>
            </div>
          </div>
        </motion.div>
      </Section>
    </Layout>
  );
}
