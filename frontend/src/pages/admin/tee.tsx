import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Shield, Server, Activity, CheckCircle, AlertTriangle, RefreshCw, Cpu } from 'lucide-react';

const nodes = [
  { id: 1, name: 'Phala Network', status: 'valid', cpu: 'Intel TDX', uptime: '99.9%', enclave: '0x7a2...f3', lastAttested: '2m ago' },
  { id: 2, name: 'Marlin OWL', status: 'valid', cpu: 'AMD SEV', uptime: '99.8%', enclave: '0x8b3...e2', lastAttested: '5m ago' },
  { id: 3, name: 'Phala Network #2', status: 'invalid', cpu: 'Intel TDX', uptime: '98.5%', enclave: '0x9c4...d1', lastAttested: '1h ago' },
];

export default function TEENodePage() {
  return (
    <Layout variant="dashboard">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">TEE Node Management</h1>
            <p className="text-on-surface-variant">Manage trusted execution environments</p>
          </div>
          <button className="btn btn-primary flex items-center gap-2">
            <RefreshCw size={18} /> Refresh Attestation
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-secondary-container rounded-lg flex items-center justify-center">
                <Shield size={24} className="text-secondary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Network Secured</p>
                <p className="text-2xl font-bold">99.8%</p>
              </div>
            </div>
            <div className="h-2 bg-surface rounded-full overflow-hidden">
              <div className="h-full bg-secondary w-[99.8%] rounded-full" />
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                <Server size={24} className="text-on-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Active Nodes</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary-container rounded-lg flex items-center justify-center">
                <Activity size={24} className="text-on-primary" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">Total Compute</p>
                <p className="text-2xl font-bold">1.2K vCPU</p>
              </div>
            </div>
          </div>
        </div>

        {/* Node List */}
        <div className="bg-surface-container-low rounded-xl overflow-hidden">
          <div className="p-6 border-b border-outline/10">
            <h2 className="text-xl font-bold">Enclave Registry</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline/10">
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Provider</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">CPU</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Uptime</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Enclave ID</th>
                  <th className="text-left p-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Last Attested</th>
                </tr>
              </thead>
              <tbody>
                {nodes.map((node) => (
                  <tr key={node.id} className="border-b border-outline/5 hover:bg-surface-container">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${node.status === 'valid' ? 'bg-secondary' : 'bg-error'}`} />
                        <span className="font-bold">{node.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm">{node.cpu}</td>
                    <td className="p-4">
                      <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${
                        node.status === 'valid' 
                          ? 'bg-secondary-container text-secondary' 
                          : 'bg-error-container text-error'
                      }`}>
                        {node.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{node.uptime}</td>
                    <td className="p-4 text-sm font-mono">{node.enclave}</td>
                    <td className="p-4 text-sm text-on-surface-variant">{node.lastAttested}</td>
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