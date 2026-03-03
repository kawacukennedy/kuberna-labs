import { readContract, writeContract, simulateContract } from "viem/actions";
import { getPublicClient, getWalletClient } from "../lib/wagmi";
import { governanceTokenABI } from "../lib/contracts";

export interface GovernanceTokenService {
  mint: (to: string, amount: bigint) => Promise<`0x${string}`>;
  delegate: (delegatee: string) => Promise<`0x${string}`>;
  getVotes: (account: string) => Promise<bigint>;
  getPastVotes: (account: string, blockNumber: bigint) => Promise<bigint>;
  balanceOf: (account: string) => Promise<bigint>;
  totalSupply: () => Promise<bigint>;
}

export function useGovernanceToken(
  tokenAddress: `0x${string}`,
): GovernanceTokenService {
  const mint = async (to: string, amount: bigint): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "mint",
      args: [to, amount],
    });

    return writeContract(walletClient, request);
  };

  const delegate = async (delegatee: string): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "delegate",
      args: [delegatee],
    });

    return writeContract(walletClient, request);
  };

  const getVotes = async (account: string): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "getVotes",
      args: [account],
    }) as Promise<bigint>;
  };

  const getPastVotes = async (
    account: string,
    blockNumber: bigint,
  ): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "getPastVotes",
      args: [account, blockNumber],
    }) as Promise<bigint>;
  };

  const balanceOf = async (account: string): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "balanceOf",
      args: [account],
    }) as Promise<bigint>;
  };

  const totalSupply = async (): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "totalSupply",
    }) as Promise<bigint>;
  };

  return {
    mint,
    delegate,
    getVotes,
    getPastVotes,
    balanceOf,
    totalSupply,
  };
}
