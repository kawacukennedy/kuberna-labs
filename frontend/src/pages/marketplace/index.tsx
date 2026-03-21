import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { IntentCard } from '@/components/marketplace/IntentCard';
import { Search, Filter, Plus, ChevronDown } from 'lucide-react';

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Intent Marketplace</h1>
            <p className="text-text-secondary">Browse and bid on agentic intents across multiple chains.</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2 py-3 px-8">
            <Plus size={18} /> Post New Intent
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row gap-6 mb-12">
          <div className="flex-grow glass p-2 rounded-2xl flex items-center">
            <div className="flex items-center px-4 gap-2 text-text-secondary border-r border-glass-border mr-2">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              placeholder="Search by keywords, chains, or tokens..." 
              className="bg-transparent border-none outline-none py-2 px-2 text-sm w-full"
            />
          </div>
          
          <div className="flex gap-4">
            <button className="btn btn-glass px-6 flex items-center gap-2 text-sm font-semibold">
              <Filter size={18} /> All Chains <ChevronDown size={14} />
            </button>
            <button className="btn btn-glass px-6 flex items-center gap-2 text-sm font-semibold">
              Status <ChevronDown size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-glass-border mb-8 gap-12 overflow-x-auto pb-px">
          {['ALL', 'OPEN FOR BIDS', 'EXECUTING', 'COMPLETED'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary"></div>}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <IntentCard 
            description="Cross-chain arbitrage between Uniswap (Ethereum) and PancakeSwap (BSC)"
            sourceChain="Ethereum"
            destChain="BSC"
            budget="500 USDC"
            deadline="2h 15m"
            status="OPEN"
            bidCount={8}
          />
          <IntentCard 
            description="Optimized liquidity provision for GMX on Arbitrum with auto-compounding"
            sourceChain="Arbitrum"
            destChain="Arbitrum"
            budget="1,200 ARB"
            deadline="5h 40m"
            status="OPEN"
            bidCount={3}
          />
          <IntentCard 
            description="Automated yield harvesting from Curve and Convex with periodic rebalancing"
            sourceChain="Ethereum"
            destChain="Polygon"
            budget="250 DAI"
            deadline="1h 10m"
            status="OPEN"
            bidCount={12}
          />
          <IntentCard 
            description="Cross-chain asset bridging and staking on Lido (Sepolia Testnet)"
            sourceChain="Sepolia"
            destChain="Holesky"
            budget="0.5 tETH"
            deadline="45m"
            status="OPEN"
            bidCount={1}
          />
          <IntentCard 
            description="Flash loan execution for token liquidation on Aave V3"
            sourceChain="Polygon"
            destChain="Polygon"
            budget="800 MATIC"
            deadline="15m"
            status="OPEN"
            bidCount={15}
          />
          <IntentCard 
            description="Minting and fractionalizing NFTs for cross-chain fractional ownership"
            sourceChain="Ethereum"
            destChain="Optimism"
            budget="300 OP"
            deadline="12h"
            status="OPEN"
            bidCount={0}
          />
        </div>
        
        <div className="mt-16 text-center">
          <button className="btn btn-glass px-12 py-3 text-sm font-bold uppercase tracking-wider">
            Load More Intents
          </button>
        </div>
      </div>
    </Layout>
  );
}
