import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useWallet } from '@/hooks/useWallet';
import { CHAIN_IDS, CHAIN_NAMES } from '@/lib/chains';

/** Every deployed contract the app talks to lives on Base Sepolia. */
export const REQUIRED_CHAIN_ID = CHAIN_IDS.BASE_SEPOLIA;

/**
 * Warns — and offers a one-click switch — when a connected wallet is on a chain
 * the contracts are not deployed on. Without this a user on Ethereum mainnet
 * signs transactions that cannot succeed and gets no explanation.
 */
export function NetworkGuard() {
  const { isConnected, chainId, switchChain } = useWallet();
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isConnected || chainId === undefined || chainId === REQUIRED_CHAIN_ID) {
    return null;
  }

  const handleSwitch = async () => {
    setError(null);
    setIsSwitching(true);
    try {
      await switchChain(REQUIRED_CHAIN_ID);
    } catch {
      setError(`Your wallet would not switch automatically. Switch to ${CHAIN_NAMES[REQUIRED_CHAIN_ID]} manually.`);
    } finally {
      setIsSwitching(false);
    }
  };

  const currentChain = CHAIN_NAMES[chainId] || `chain ${chainId}`;

  return (
    <div role="status" className="border-b border-tertiary/30 bg-tertiary/10 px-6 py-3">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-on-surface">
          <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-tertiary" aria-hidden />
          <span>
            You are connected to <strong>{currentChain}</strong>. Kuberna contracts are deployed on{' '}
            <strong>{CHAIN_NAMES[REQUIRED_CHAIN_ID]}</strong>, so on-chain actions will fail here.
            {error ? <span className="mt-1 block text-xs text-error">{error}</span> : null}
          </span>
        </p>
        <button
          type="button"
          onClick={handleSwitch}
          disabled={isSwitching}
          className="btn btn-primary min-h-11 px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSwitching ? 'Switching…' : `Switch to ${CHAIN_NAMES[REQUIRED_CHAIN_ID]}`}
        </button>
      </div>
    </div>
  );
}
