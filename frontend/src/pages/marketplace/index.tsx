import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { IntentCard } from '@/components/marketplace/IntentCard';
import { Search, Filter, Plus, ChevronDown, Sparkles, Activity, ArrowRight } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

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

const intents = [
  { id: 1, description: "Cross-chain arbitrage between Uniswap (Ethereum) and PancakeSwap (BSC)", sourceChain: "Ethereum", destChain: "BSC", budget: "500 USDC", deadline: "2h 15m", status: "OPEN", bidCount: 8 },
  { id: 2, description: "Optimized liquidity provision for GMX on Arbitrum with auto-compounding", sourceChain: "Arbitrum", destChain: "Arbitrum", budget: "1,200 ARB", deadline: "5h 40m", status: "OPEN", bidCount: 3 },
  { id: 3, description: "Automated yield harvesting from Curve and Convex with rebalancing", sourceChain: "Ethereum", destChain: "Polygon", budget: "250 DAI", deadline: "1h 10m", status: "EXECUTING", bidCount: 12 },
  { id: 4, description: "Cross-chain asset bridging and staking on Lido (Sepolia Testnet)", sourceChain: "Sepolia", destChain: "Holesky", budget: "0.5 tETH", deadline: "45m", status: "OPEN", bidCount: 1 },
  { id: 5, description: "Flash loan execution for token liquidation on Aave V3", sourceChain: "Polygon", destChain: "Polygon", budget: "800 MATIC", deadline: "15m", status: "OPEN", bidCount: 15 },
  { id: 6, description: "Minting and fractionalizing NFTs for cross-chain fractional ownership", sourceChain: "Ethereum", destChain: "Optimism", budget: "300 OP", deadline: "12h", status: "OPEN", bidCount: 0 },
];

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('ALL');

  const filteredIntents = activeTab === 'ALL'
    ? intents
    : intents.filter(i => i.status.toUpperCase() === activeTab || (activeTab === 'OPEN FOR BIDS' && i.status === 'OPEN'));

  return (
    <Layout>
      <section className="relative overflow-hidden pt-28 pb-16 px-6 text-center bg-surface">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-secondary-fixed/10 via-transparent to-transparent" />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="max-w-4xl mx-auto"
        >
          <span className="px-4 py-1.5 rounded-full bg-surface-container text-secondary font-bold text-xs uppercase tracking-widest mb-6 inline-flex items-center gap-2">
            <Activity size={14} className="inline" /> Live Solver Network
          </span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            Intent <span className="text-primary">Marketplace</span>
          </h1>
          <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto">
            Browse and bid on agentic intents across multiple chains. Let autonomous agents execute your complex cross‑chain operations securely.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/marketplace/post" className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto flex items-center gap-3">
              <Plus size={20} /> Post New Intent
            </Link>
            <button className="btn btn-glass px-10 py-4 text-lg w-full sm:w-auto">
              How it Works
            </button>
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <Section className="flex flex-col lg:flex-row gap-6 mb-12">
          <motion.div variants={fadeUp} className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
            <input 
              type="text" 
              placeholder="Search by keyword, chain name, or token symbol..." 
              className="w-full pl-12 pr-4 py-3.5 bg-surface-container-low border border-outline/10 rounded-lg text-on-surface focus:ring-0 focus:bg-surface-container focus:shadow-glow transition-all"
            />
          </motion.div>
          
          <motion.div variants={fadeUp} className="flex gap-4">
            <button className="btn btn-glass px-6 py-3.5 flex items-center gap-2.5 text-sm font-bold shadow-sm">
              <Filter size={18} className="text-primary" /> All Chains <ChevronDown size={14} />
            </button>
            <button className="btn btn-glass px-6 py-3.5 flex items-center gap-2.5 text-sm font-bold shadow-sm">
              Status <ChevronDown size={14} />
            </button>
          </motion.div>
        </Section>

        <Section className="flex border-b border-outline/10 mb-12 gap-10 overflow-x-auto">
          {['ALL', 'OPEN FOR BIDS', 'EXECUTING', 'COMPLETED'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${
                activeTab === tab ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div 
                  layoutId="tab-underline"
                  className="absolute bottom-0 left-0 w-full h-0.5 bg-primary" 
                />
              )}
            </button>
          ))}
        </Section>

        <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIntents.map((intent) => (
            <motion.div key={intent.id} variants={fadeUp}>
              <IntentCard {...intent} />
            </motion.div>
          ))}
        </Section>
        
        <Section className="mt-20 text-center">
          <button className="btn btn-glass px-12 py-4 text-sm font-bold uppercase tracking-widest hover:border-primary transition-all shadow-sm">
            Load More Intents
          </button>
        </Section>
      </div>
    </Layout>
  );
}