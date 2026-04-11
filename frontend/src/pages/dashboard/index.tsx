import React, { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { StatCard } from '@/components/dashboard/StatCard';
import { CourseCard } from '@/components/shared/CourseCard';
import { useAuth } from '@/context/AuthContext';
import { Cpu, BookMarked, MessageSquare, Zap, Play, ChevronRight, Activity } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/me`);
        setStats(response.data.stats);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token]);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome, {user?.fullName.split(' ')[0]}!</h1>
            <p className="text-text-secondary">Here&apos;s what&apos;s happening with your projects today.</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <Zap size={18} /> New Agent
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard 
            label="Active Agents" 
            value={stats?.agentsCount || 0} 
            icon={<Cpu className="text-primary" size={24} />} 
            trend="+2"
            trendPositive={true}
          />
          <StatCard 
            label="Courses Enrolled" 
            value={stats?.coursesEnrolled || 0} 
            icon={<BookMarked className="text-secondary" size={24} />} 
          />
          <StatCard 
            label="Intents Posted" 
            value={stats?.intentsPosted || 0} 
            icon={<MessageSquare className="text-accent" size={24} />} 
            trend="-1"
            trendPositive={false}
          />
          <StatCard 
            label="Reputation Score" 
            value="1,250" 
            icon={<Activity className="text-primary-dark" size={24} />} 
            trend="+120"
            trendPositive={true}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content Area: Enrolled Courses */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Continue Learning</h2>
                <Link href="/courses" className="text-sm font-semibold text-primary hover:underline flex items-center">
                  View All <ChevronRight size={16} />
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <CourseCard 
                  title="Advanced Multi-Chain Intent Engineering"
                  instructor="Dr. Alice Smith"
                  thumbnail="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600"
                  progress={65}
                  level="Advanced"
                  duration="12h 30m"
                />
                <CourseCard 
                  title="Securing Agents with TEE & zkTLS"
                  instructor="Bob Johnson"
                  thumbnail="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600"
                  progress={20}
                  level="Intermediate"
                  duration="8h 15m"
                />
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Your Active Agents</h2>
                <button className="text-sm font-semibold text-primary hover:underline flex items-center">
                  Manage All <ChevronRight size={16} />
                </button>
              </div>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-surface transition-colors border border-transparent hover:border-glass-border">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                        <Cpu size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold">Alpha-Arbitrage-v{i}</h4>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-secondary rounded-full"></div> Running</span>
                          <span>&bull;</span>
                          <span>Last active: 2m ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button className="p-2 hover:bg-white rounded-lg transition-colors"><Activity size={18} className="text-text-secondary" /></button>
                       <button className="p-2 hover:bg-white rounded-lg transition-colors"><Play size={18} className="text-primary" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar: Activity/Marketplace */}
          <div className="space-y-8">
            <section className="glass p-6 rounded-[32px]">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <div className="space-y-6">
                {[
                  { type: 'intent', text: 'Intent "Cross-chain swap" completed', time: '1h ago', icon: <Zap size={14} />, color: 'text-accent bg-accent/10' },
                  { type: 'course', text: 'Enrolled in "TEE Security Deep Dive"', time: '3h ago', icon: <BookMarked size={14} />, color: 'text-secondary bg-secondary/10' },
                  { type: 'agent', text: 'Agent "Alpha" deployed to Arbitrum', time: '5h ago', icon: <Cpu size={14} />, color: 'text-primary bg-primary/10' },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className={`mt-1 p-2 rounded-lg h-fit ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.text}</p>
                      <span className="text-xs text-text-secondary">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="glass p-6 rounded-[32px] bg-primary text-white">
              <h3 className="text-xl font-bold mb-4">Intent Marketplace</h3>
              <p className="text-sm opacity-80 mb-6">There are 12 new high-value intents matching your agents skills.</p>
              <Link href="/marketplace" className="btn bg-white text-primary w-full text-xs font-bold uppercase tracking-wider py-3">
                Browse Marketplace
              </Link>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Add Link to types if not imported
import Link from 'next/link';
