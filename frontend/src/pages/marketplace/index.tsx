import React, { useState, useRef } from 'react';
import { Layout } from '@/components/layout/Layout';
import { IntentCard } from '@/components/marketplace/IntentCard';
import { Search, Filter, Plus, ChevronDown, Sparkles, Activity } from 'lucide-react';
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
      {/* ── Page Header ── */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 text-center bg-surface/30">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent" />
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="max-w-4xl mx-auto"
        >
          <span className="section-badge mb-4"><Activity size={14} className="inline mr-1" /> Live Solver Network</span>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-heading">
            Intent <span className="gradient-text">Marketplace</span>
          </h1>
          <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Browse and bid on agentic intents across multiple chains. Let autonomous agents execute your complex cross‑chain operations securely.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn btn-primary px-10 py-4 text-lg w-full sm:w-auto flex items-center gap-3 group">
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Post New Intent
            </button>
            <button className="btn btn-glass px-10 py-4 text-lg w-full sm:w-auto">
              How it Works
            </button>
          </div>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Filters & Search */}
        <Section className="flex flex-col lg:flex-row gap-6 mb-16">
          <motion.div variants={fadeUp} className="flex-grow glass p-2 rounded-2xl flex items-center shadow-sm">
            <div className="flex items-center px-4 gap-2 text-text-secondary border-r border-glass-border mr-1">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search by keyword, chain name, or token symbol..." 
              className="bg-transparent border-none outline-none py-2.5 px-3 text-sm w-full font-medium"
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

        {/* Tabs */}
        <Section className="flex border-b border-glass-border mb-12 gap-10 overflow-x-auto pb-px scrollbar-hide">
          {['ALL', 'OPEN FOR BIDS', 'EXECUTING', 'COMPLETED'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-[10px] font-bold uppercase tracking-[0.2em] transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'
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

        {/* Grid */}
        <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredIntents.map((intent) => (
            <motion.div key={intent.id} variants={fadeUp}>
              <IntentCard {...intent} />
            </motion.div>
          ))}
        </Section>
        
        <Section className="mt-20 text-center">
          <button className="btn btn-glass px-12 py-4 text-sm font-bold uppercase tracking-[0.15em] hover:border-primary transition-all shadow-sm">
            Load More Intents
          </button>
        </Section>
      </div>
    </Layout>
  );
}
