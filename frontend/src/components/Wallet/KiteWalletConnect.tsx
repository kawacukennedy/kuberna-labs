import React, { useState, useEffect } from 'react';
import { CreditCard, Wallet, ExternalLink, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiUrl } from '@/lib/api';
import axios from 'axios';

interface KiteWalletInfo {
  connected: boolean;
  kiteWalletAddress: string | null;
  balances?: Array<{ asset: string; amount: string; usdValue: string }>;
}

interface SessionData {
  sessionId: string;
  approvalUrl: string;
}

export function KiteWalletConnect() {
  const { token } = useAuth();
  const [walletInfo, setWalletInfo] = useState<KiteWalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState<SessionData | null>(null);

  useEffect(() => {
    if (token) fetchWalletInfo();
    else setLoading(false);
  }, [token]);

  const fetchWalletInfo = async () => {
    try {
      const resp = await axios.get(apiUrl('/kite/wallet'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.success) {
        setWalletInfo(resp.data.data);
      }
    } catch {
      console.warn('Failed to fetch Kite wallet info');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const addr = walletAddress.trim();
    if (!addr.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Please enter a valid Kite wallet address (0x-prefixed, 40 hex chars)');
      return;
    }
    setConnecting(true);
    try {
      const resp = await axios.post(
        apiUrl('/kite/wallet/connect'),
        { kiteWalletAddress: addr },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        setWalletInfo({ connected: true, kiteWalletAddress: addr });
        setWalletAddress('');
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  const handleCreateSession = async (agentId: string) => {
    setSessionLoading(true);
    setSessionResult(null);
    try {
      const resp = await axios.post(
        apiUrl('/kite/sessions/create'),
        {
          agentId,
          taskSummary: 'Execute paid agent tasks via Kite x402',
          maxAmountPerTx: 10,
          maxTotalAmount: 50,
          ttl: '24h',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (resp.data.success) {
        setSessionResult(resp.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to create session');
    } finally {
      setSessionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6 animate-pulse">
        <div className="h-6 w-48 bg-surface-container rounded mb-4" />
        <div className="h-12 w-full bg-surface-container rounded" />
      </div>
    );
  }

  if (!walletInfo?.connected) {
    return (
      <div className="bg-surface-container-low rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet size={24} className="text-primary" />
          <h3 className="text-xl font-bold">Kite Passport</h3>
        </div>
        <p className="text-sm text-on-surface-variant mb-4">
          Connect your Kite Passport wallet to enable agents to make x402 payments.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-4 py-2.5 bg-surface-container border border-outline/10 rounded-xl text-sm focus:ring-2 focus:ring-primary/30 outline-none font-mono"
          />
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn btn-primary flex items-center gap-2 px-4"
          >
            {connecting ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
            Connect
          </button>
        </div>
        <p className="text-xs text-on-surface-variant mt-3">
          Get your wallet address from{' '}
          <a href="https://agentpassport.ai" target="_blank" rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1">
            agentpassport.ai <ExternalLink size={12} />
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
            <CheckCircle size={20} className="text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Kite Passport</h3>
            <p className="text-xs text-on-surface-variant font-mono">
              {walletInfo.kiteWalletAddress?.slice(0, 10)}...{walletInfo.kiteWalletAddress?.slice(-6)}
            </p>
          </div>
        </div>
        <a
          href={`https://agentpassport.ai/wallet/${walletInfo.kiteWalletAddress}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          Dashboard <ExternalLink size={12} />
        </a>
      </div>

      {walletInfo.balances && walletInfo.balances.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Balances
          </p>
          <div className="space-y-1">
            {walletInfo.balances.map((b, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{b.asset}</span>
                <span className="font-mono">{b.amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-outline/10 pt-4 mt-4">
        <p className="text-sm font-medium mb-3">Active Spending Sessions</p>
        <button
          onClick={() => handleCreateSession('')}
          disabled={sessionLoading}
          className="w-full btn btn-glass text-sm flex items-center justify-center gap-2"
        >
          {sessionLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CreditCard size={16} />
          )}
          New Spending Session
        </button>

        {sessionResult && (
          <div className="mt-3 p-3 bg-surface-container rounded-xl text-sm">
            <p className="text-primary font-medium mb-1">Session Created!</p>
            <p className="text-xs text-on-surface-variant font-mono mb-2">
              ID: {sessionResult.sessionId}
            </p>
            <a
              href={sessionResult.approvalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary w-full text-xs flex items-center justify-center gap-1 py-2"
            >
              Approve Session <ExternalLink size={12} />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
