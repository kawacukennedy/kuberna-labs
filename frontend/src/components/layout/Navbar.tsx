import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/hooks/useWallet';
import { Search, Bell, User, Menu } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { address, isConnected, connect, disconnect } = useWallet();

  return (
    <nav className="glass sticky top-0 z-50 w-full px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-2xl font-bold tracking-tight text-primary">
          KUBERNA<span className="text-text-primary ml-1">LABS</span>
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link href="/courses" className="text-sm font-medium hover:text-primary transition-colors">Courses</Link>
          <Link href="/agents" className="text-sm font-medium hover:text-primary transition-colors">Agents</Link>
          <Link href="/marketplace" className="text-sm font-medium hover:text-primary transition-colors">Marketplace</Link>
          <Link href="/docs" className="text-sm font-medium hover:text-primary transition-colors">Docs</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center bg-surface px-3 py-1.5 rounded-full border border-glass-border">
          <Search size={16} className="text-text-secondary" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-none outline-none px-2 text-sm w-32 focus:w-48 transition-all"
          />
        </div>
        
        <button className="p-2 hover:bg-surface rounded-full transition-colors relative">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background"></span>
        </button>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex flex-col items-end">
              <span className="text-xs font-semibold">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              <span className="text-[10px] text-text-secondary cursor-pointer hover:text-primary" onClick={disconnect}>Disconnect</span>
            </div>
            <Link href="/dashboard" className="p-2 bg-surface rounded-full border border-glass-border">
              <User size={20} />
            </Link>
          </div>
        ) : (
          <button onClick={() => connect()} className="btn btn-primary text-sm py-2 px-6">
            Connect
          </button>
        )}
        
        <button className="md:hidden p-2 hover:bg-surface rounded-full">
          <Menu size={20} />
        </button>
      </div>
    </nav>
  );
};
