import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Shield, Bell, CreditCard, Key, Settings, LogOut, ChevronRight, BookOpen, Clock, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <Layout variant="dashboard">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">My Profile</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-surface-container-low rounded-xl p-8 text-center">
              <div className="w-24 h-24 rounded-full bg-primary-container flex items-center justify-center mx-auto mb-4">
                <User size={40} className="text-on-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-1">{user?.fullName || 'User'}</h2>
              <p className="text-on-surface-variant mb-4">{user?.email || 'user@example.com'}</p>
              <span className="text-xs font-bold uppercase tracking-widest px-4 py-1.5 bg-primary text-white rounded-full">
                LEARNER
              </span>
            </div>

            <div className="mt-6 space-y-2">
              <Link href="/profile" className="sidebar-item active">
                <User size={18} /> Profile
              </Link>
              <Link href="/settings" className="sidebar-item">
                <Settings size={18} /> Account Settings
              </Link>
              <Link href="/settings#security" className="sidebar-item">
                <Shield size={18} /> Security
              </Link>
              <Link href="/settings#notifications" className="sidebar-item">
                <Bell size={18} /> Notifications
              </Link>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Enrolled Courses */}
            <section>
              <h3 className="text-xl font-bold mb-6">Enrolled Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: "Advanced Multi-Chain Intent Engineering", progress: 65, thumbnail: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600" },
                  { title: "Securing Agents with TEE & zkTLS", progress: 20, thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=600" },
                ].map((course, idx) => (
                  <div key={idx} className="bg-surface-container-low rounded-xl p-4 flex gap-4">
                    <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface">
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold mb-2">{course.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
                        <Clock size={12} /> 12h 30m total
                      </div>
                      <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-right mt-1 text-on-surface-variant">{course.progress}% complete</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Certificates */}
            <section>
              <h3 className="text-xl font-bold mb-6">Certificates</h3>
              <div className="bg-surface-container-low rounded-xl p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-secondary-container flex items-center justify-center">
                  <Award size={32} className="text-secondary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold">Introduction to Agentic Web3 Systems</h4>
                  <p className="text-sm text-on-surface-variant">Completed January 2024</p>
                </div>
                <button className="text-primary hover:underline text-sm font-medium flex items-center gap-2">
                  View <ChevronRight size={14} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}