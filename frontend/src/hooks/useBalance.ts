import { useState, useEffect, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { Address, formatEther, formatUnits, parseEther, parseUnits } from 'viem';
import { useWallet } from './useWallet';
import { getSupportedTokens, TokenInfo, formatTokenAmount, parseTokenAmount } from '../lib/adapters';
import { CHAIN_IDS } from '../lib/chains';

interface TokenBalance {
  token: TokenInfo;
  balance: bigint;
  formatted: string;
}

interface UseBalanceReturn {
  nativeBalance: {
    balance: bigint;
    formatted: string;
  } | null;
  tokens: TokenBalance[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useBalance(): UseBalanceReturn {
  const { address, chainId, isConnected } = useWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  
  const [nativeBalance, setNativeBalance] = useState<{ balance: bigint; formatted: string } | null>(null);
  const [tokens, setTokens] = useState<TokenBalance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchNativeBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    
    try {
      const balance = await publicClient.getBalance({ address });
      setNativeBalance({
        balance,
        formatted: formatEther(balance),
      });
    } catch (err) {
      console.error('Failed to fetch native balance:', err);
    }
  }, [address, publicClient]);
  
  const fetchTokenBalances = useCallback(async () => {
    if (!address || !chainId || !walletClient) return;
    
    try {
      const supportedTokens = await getSupportedTokens(chainId);
      
      const balances = await Promise.all(
        supportedTokens.map(async (token) => {
          if (token.isNative) {
            return null;
          }
          
          try {
            const balance = await publicClient.readContract({
              address: token.address as Address,
              abi: [
                {
                  name: 'balanceOf',
                  inputs: [{ name: 'owner', type: 'address' }],
                  outputs: [{ name: '', type: 'uint256' }],
                  stateMutability: 'view',
                  type: 'function',
                },
              ],
              functionName: 'balanceOf',
              args: [address],
            });
            
            return {
              token,
              balance: balance as bigint,
              formatted: formatUnits(balance as bigint, token.decimals),
            };
          } catch {
            return null;
          }
        })
      );
      
      setTokens(balances.filter((b): b is TokenBalance => b !== null));
    } catch (err) {
      console.error('Failed to fetch token balances:', err);
    }
  }, [address, chainId, publicClient, walletClient]);
  
  const refetch = useCallback(async () => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([fetchNativeBalance(), fetchTokenBalances()]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balances'));
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, fetchNativeBalance, fetchTokenBalances]);
  
  useEffect(() => {
    if (isConnected && address) {
      refetch();
    }
  }, [isConnected, address, chainId, refetch]);
  
  return {
    nativeBalance,
    tokens,
    isLoading,
    error,
    refetch,
  };
}

export function useTokenBalance(tokenAddress: Address | null): {
  balance: bigint;
  formatted: string;
  refetch: () => Promise<void>;
} {
  const { address, chainId } = useWallet();
  const publicClient = usePublicClient();
  
  const [balance, setBalance] = useState<bigint>(0n);
  const [formatted, setFormatted] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  
  const fetchBalance = useCallback(async () => {
    if (!address || !publicClient) return;
    
    setIsLoading(true);
    
    try {
      let newBalance: bigint;
      
      if (!tokenAddress) {
        newBalance = await publicClient.getBalance({ address });
        setFormatted(formatEther(newBalance));
      } else {
        newBalance = await publicClient.readContract({
          address: tokenAddress,
          abi: [
            {
              name: 'balanceOf',
              inputs: [{ name: 'owner', type: 'address' }],
              outputs: [{ name: '', type: 'uint256' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'balanceOf',
          args: [address],
        }) as bigint;
        
        const decimals = await publicClient.readContract({
          address: tokenAddress,
          abi: [
            {
              name: 'decimals',
              outputs: [{ name: '', type: 'uint8' }],
              stateMutability: 'view',
              type: 'function',
            },
          ],
          functionName: 'decimals',
          args: [],
        }) as number;
        
        setFormatted(formatUnits(newBalance, decimals));
      }
      
      setBalance(newBalance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, tokenAddress]);
  
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);
  
  return { balance, formatted, refetch: fetchBalance };
}
