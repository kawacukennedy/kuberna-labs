import React from 'react';
import { Hash, MapPin, Clock, DollarSign, ArrowRight, ShieldCheck, Activity, CheckCircle2 } from 'lucide-react';

interface IntentCardProps {
  description: string;
  sourceChain: string;
  destChain: string;
  budget: string;
  deadline: string;
  status: string;
  bidCount: number;
}

const getStatusStyles = (status: string) => {
  switch (status.toUpperCase()) {
    case 'OPEN':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-600',
        dot: 'bg-emerald-500',
        icon: Activity
      };
    case 'EXECUTING':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-600',
        dot: 'bg-amber-500',
        icon: ShieldCheck
      };
    case 'COMPLETED':
      return {
        bg: 'bg-indigo-500/10',
        text: 'text-indigo-600',
        dot: 'bg-indigo-500',
        icon: CheckCircle2
      };
    default:
      return {
        bg: 'bg-slate-500/10',
        text: 'text-slate-600',
        dot: 'bg-slate-500',
        icon: Activity
      };
  }
};

export const IntentCard: React.FC<IntentCardProps> = ({ description, sourceChain, destChain, budget, deadline, status, bidCount }) => {
  const styles = getStatusStyles(status);
  const Icon = styles.icon;

  return (
    <div className="glass glass-card group flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className={`flex items-center gap-2 px-3 py-1.5 ${styles.bg} rounded-full border border-current transition-colors duration-300`}>
          <div className={`w-2 h-2 ${styles.dot} rounded-full animate-pulse`}></div>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${styles.text}`}>{status}</span>
        </div>
        <div className="text-xs text-text-secondary flex items-center gap-1.5 font-medium">
          <Clock size={14} className="text-primary" /> {deadline}
        </div>
      </div>

      <div className="flex-grow">
        <h3 className="text-xl font-bold mb-3 font-heading leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {description}
        </h3>
        <div className="flex items-center gap-3 text-sm text-text-secondary bg-surface/50 p-3 rounded-xl border border-glass-border">
          <div className="flex items-center gap-1.5 font-bold text-text-primary">
            <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${sourceChain.toLowerCase() === 'ethereum' ? 'eth' : sourceChain.toLowerCase()}.png`} 
                 onError={(e) => (e.currentTarget.src = 'https://cryptologos.cc/logos/ethereum-eth-logo.png')}
                 className="w-5 h-5 rounded-full" alt={sourceChain} />
            {sourceChain}
          </div>
          <ArrowRight size={14} className="text-primary opacity-50" />
          <div className="flex items-center gap-1.5 font-bold text-text-primary">
             <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${destChain.toLowerCase() === 'ethereum' ? 'eth' : destChain.toLowerCase()}.png`}
                  onError={(e) => (e.currentTarget.src = 'https://cryptologos.cc/logos/ethereum-eth-logo.png')}
                  className="w-5 h-5 rounded-full" alt={destChain} />
            {destChain}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-5 border-y border-glass-border">
        <div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] block mb-1.5">Available Budget</span>
          <div className="flex items-center gap-1.5 text-primary text-lg font-bold font-heading">
            <DollarSign size={18} /> {budget}
          </div>
        </div>
        <div className="text-right items-end flex flex-col">
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-[0.15em] block mb-1.5">Solver Bids</span>
          <div className="font-bold text-lg font-heading">{bidCount} <span className="text-xs font-normal text-text-secondary">active</span></div>
        </div>
      </div>

      <button className="btn btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 group/btn">
        View & Submit Bid <ArrowRight size={18} className="group-hover/btn:translate-x-1.5 transition-transform" />
      </button>
    </div>
  );
};
