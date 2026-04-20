import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Sidebar } from '@/components/layout/Sidebar';
import { Users, DollarSign, Bot, BarChart3, Shield, Search, MoreVertical, ChevronDown } from 'lucide-react';

const users = [
  { id: 1, name: 'Alice M.', email: 'alice@example.com', role: 'Learner', status: 'Active', joined: 'Jan 2024' },
  { id: 2, name: 'Bob K.', email: 'bob@example.com', role: 'Agent', status: 'Active', joined: 'Dec 2023' },
  { id: 3, name: 'Charlie D.', email: 'charlie@example.com', role: 'Admin', status: 'Active', joined: 'Nov 2023' },
  { id: 4, name: 'Diana F.', email: 'diana@example.com', role: 'Learner', status: 'Suspended', joined: 'Oct 2023' },
];

export default function AdminDashboard() {
  return (
    <Layout variant="dashboard" sidebarType="admin">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-on-surface-variant">Manage users, courses, and platform analytics</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                <Users size={24} className="text-on-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Total Users</p>
                <p className="text-2xl font-bold">12,458</p>
              </div>
            </div>
            <p className="text-xs text-secondary">+24 this week</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-on-secondary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Revenue</p>
                <p className="text-2xl font-bold">$89,420</p>
              </div>
            </div>
            <p className="text-xs text-secondary">+12% this month</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-tertiary-container rounded-lg flex items-center justify-center">
                <Bot size={24} className="text-on-tertiary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Active Agents</p>
                <p className="text-2xl font-bold">3,891</p>
              </div>
            </div>
            <p className="text-xs text-secondary">+156 this week</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                <Shield size={24} className="text-on-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Success Rate</p>
                <p className="text-2xl font-bold">99.2%</p>
              </div>
            </div>
            <p className="text-xs text-secondary">+0.3% this week</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline/10 flex justify-between items-center">
            <h2 className="text-xl font-bold">User Management</h2>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-surface border border-outline/10 rounded-lg text-sm"
                />
              </div>
              <button className="btn btn-glass px-4 py-2 text-sm flex items-center gap-2">
                Filter <ChevronDown size={14} />
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline/10">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">User</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Role</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Joined</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-outline/5 hover:bg-surface-container">
                    <td className="p-4">
                      <div>
                        <p className="font-bold">{user.name}</p>
                        <p className="text-sm text-on-surface-variant">{user.email}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase px-3 py-1 bg-primary-container text-on-primary rounded-full">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                        user.status === 'Active' 
                          ? 'bg-secondary-container text-secondary' 
                          : 'bg-error-container text-error'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">{user.joined}</td>
                    <td className="p-4">
                      <button className="p-2 hover:bg-surface rounded-lg">
                        <MoreVertical size={16} className="text-on-surface-variant" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}