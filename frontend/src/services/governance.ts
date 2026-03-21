import { readContract, writeContract, simulateContract } from "@wagmi/core";
import { config } from "../lib/wagmi";
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
    const { request } = await simulateContract(config as any, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "mint",
      args: [to as `0x${string}`, amount],
    });

    return writeContract(config as any, request);
  };

  const delegate = async (delegatee: string): Promise<`0x${string}`> => {
    const { request } = await simulateContract(config as any, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "delegate",
      args: [delegatee as `0x${string}`],
    });

    return writeContract(config as any, request);
  };

  const getVotes = async (account: string): Promise<bigint> => {
    return readContract(config as any, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "getVotes",
      args: [account as `0x${string}`],
    }) as Promise<bigint>;
  };

  const getPastVotes = async (
    account: string,
    blockNumber: bigint,
  ): Promise<bigint> => {
    return readContract(config as any, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "getPastVotes",
      args: [account as `0x${string}`, blockNumber],
    }) as Promise<bigint>;
  };

  const balanceOf = async (account: string): Promise<bigint> => {
    return readContract(config as any, {
      address: tokenAddress,
      abi: governanceTokenABI,
      functionName: "balanceOf",
      args: [account as `0x${string}`],
    }) as Promise<bigint>;
  };

  const totalSupply = async (): Promise<bigint> => {
    return readContract(config as any, {
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
