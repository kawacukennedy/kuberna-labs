import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendPositive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, trend, trendPositive }) => {
  return (
    <div className="glass p-6 rounded-3xl">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-surface rounded-2xl border border-glass-border">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${trendPositive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-3xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-text-secondary font-medium uppercase tracking-wider">{label}</p>
    </div>
  );
};
