import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { User, Mail, Shield, Wallet, Bell, Moon, Globe, Trash2, Camera, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useWallet } from '@/hooks/useWallet';

export default function ProfilePage() {
  const { user } = useAuth();
  const { address, isConnected } = useWallet();
  const [activeSection, setActiveSection] = useState('GENERAL');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-12">Account Settings</h1>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Nav */}
          <div className="w-full lg:w-64 shrink-0">
            <div className="glass p-2 rounded-2xl space-y-1">
              {[
                { id: 'GENERAL', label: 'General', icon: <User size={18} /> },
                { id: 'SECURITY', label: 'Security', icon: <Shield size={18} /> },
                { id: 'WALLET', label: 'Web3 Wallet', icon: <Wallet size={18} /> },
                { id: 'NOTIFICATIONS', label: 'Notifications', icon: <Bell size={18} /> },
                { id: 'DANGER', label: 'Danger Zone', icon: <Trash2 size={18} /> },
              ].map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeSection === item.id ? 'bg-primary text-white shadow-lg' : 'hover:bg-surface text-text-secondary hover:text-text-primary'}`}
                >
                   {item.icon} {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-grow max-w-2xl">
            {activeSection === 'GENERAL' && (
              <div className="space-y-8 animate-fade-in">
                <section>
                  <h3 className="text-xl font-bold mb-6">Profile Information</h3>
                  <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 bg-surface rounded-full border-2 border-glass-border flex items-center justify-center text-primary overflow-hidden">
                        <User size={48} />
                      </div>
                      <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Camera size={14} />
                      </button>
                    </div>
                    <div>
                      <h4 className="font-bold text-lg">{user?.fullName}</h4>
                      <p className="text-sm text-text-secondary uppercase font-bold tracking-widest">{user?.roles[0] || 'Member'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Full Name</label>
                      <input type="text" defaultValue={user?.fullName} className="w-full bg-surface border border-glass-border rounded-xl py-3 px-4 text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary uppercase tracking-widest">Email Address</label>
                      <input type="email" defaultValue={user?.email} className="w-full bg-surface border border-glass-border rounded-xl py-3 px-4 text-sm outline-none focus:border-primary" />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-6">Platform Preferences</h3>
                  <div className="glass p-6 rounded-3xl space-y-6">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Moon size={20} className="text-text-secondary" />
                           <div>
                              <p className="font-bold text-sm">Dark Mode</p>
                              <p className="text-xs text-text-secondary">Toggle between light and dark themes</p>
                           </div>
                        </div>
                        <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                           <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Globe size={20} className="text-text-secondary" />
                           <div>
                              <p className="font-bold text-sm">Public Profile</p>
                              <p className="text-xs text-text-secondary">Allow others to see your agents and stats</p>
                           </div>
                        </div>
                        <div className="w-12 h-6 bg-surface rounded-full relative cursor-pointer">
                           <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full border border-glass-border"></div>
                        </div>
                     </div>
                  </div>
                </section>

                <button className="btn btn-primary px-8 py-3.5">Save Changes</button>
              </div>
            )}

            {activeSection === 'WALLET' && (
              <div className="space-y-8 animate-fade-in">
                 <section>
                    <h3 className="text-xl font-bold mb-4">Web3 Identity</h3>
                    <p className="text-sm text-text-secondary mb-8">Manage your connected wallets and blockchain identities.</p>
                    
                    <div className="glass p-6 rounded-[32px] border-2 border-primary/20 bg-primary/5">
                       <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                             <div className="p-3 bg-white rounded-2xl shadow-sm text-primary">
                                <Wallet size={24} />
                             </div>
                             <div>
                                <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">Main Wallet</p>
                                <p className="font-mono text-sm font-bold truncate max-w-[200px] md:max-w-none">{address || '0x...Not Connected'}</p>
                             </div>
                          </div>
                          {isConnected && <CheckCircle2 className="text-emerald-500" size={24} />}
                       </div>
                       
                       <div className="flex gap-4">
                          <button className="btn btn-glass py-2 px-6 text-xs font-bold uppercase tracking-wider">Change Wallet</button>
                          <button className="btn bg-white text-primary border border-primary/10 py-2 px-6 text-xs font-bold uppercase tracking-wider">Disconnect</button>
                       </div>
                    </div>
                 </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
