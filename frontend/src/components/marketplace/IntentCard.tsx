import React from 'react';
import { Hash, MapPin, Clock, DollarSign, ArrowRight } from 'lucide-react';

interface IntentCardProps {
  description: string;
  sourceChain: string;
  destChain: string;
  budget: string;
  deadline: string;
  status: string;
  bidCount: number;
}

export const IntentCard: React.FC<IntentCardProps> = ({ description, sourceChain, destChain, budget, deadline, status, bidCount }) => {
  return (
    <div className="glass glass-card flex flex-col gap-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2 px-3 py-1 bg-surface rounded-full border border-glass-border">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
        </div>
        <div className="text-xs text-text-secondary flex items-center gap-1">
          <Clock size={12} /> {deadline}
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-2 line-clamp-2">{description}</h3>
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <span className="flex items-center gap-1 font-medium text-text-primary">
            <MapPin size={14} /> {sourceChain}
          </span>
          <ArrowRight size={14} />
          <span className="flex items-center gap-1 font-medium text-text-primary">
            <MapPin size={14} /> {destChain}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-4 border-y border-glass-border">
        <div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Budget</span>
          <div className="flex items-center gap-1 text-primary font-bold">
            <DollarSign size={16} /> {budget}
          </div>
        </div>
        <div>
          <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest block mb-1">Bids</span>
          <div className="font-bold">{bidCount} <span className="text-xs font-normal text-text-secondary">Active</span></div>
        </div>
      </div>

      <button className="btn btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
        View & Submit Bid <ArrowRight size={16} />
      </button>
    </div>
  );
};
