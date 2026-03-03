import { simulateContract, writeContract, readContract } from "viem/actions";
import { getPublicClient, getWalletClient } from "../lib/wagmi";
import { priceOracleABI } from "../lib/contracts";

export interface PriceOracleService {
  setPendingPrice: (token: string, price: bigint) => Promise<`0x${string}`>;
  confirmPrice: (token: string) => Promise<`0x${string}`>;
  getPrice: (token: string) => Promise<bigint>;
  getPriceOrFallback: (token: string, fallback: bigint) => Promise<bigint>;
  getPriceData: (
    token: string,
  ) => Promise<{ price: bigint; timestamp: bigint }>;
  getPriceHistory: (token: string) => Promise<bigint[]>;
}

export function usePriceOracle(
  oracleAddress: `0x${string}`,
): PriceOracleService {
  const setPendingPrice = async (
    token: string,
    price: bigint,
  ): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "setPendingPrice",
      args: [token as `0x${string}`, price],
    });

    return writeContract(walletClient, request);
  };

  const confirmPrice = async (token: string): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "confirmPrice",
      args: [token as `0x${string}`],
    });

    return writeContract(walletClient, request);
  };

  const getPrice = async (token: string): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPrice",
      args: [token as `0x${string}`],
    }) as Promise<bigint>;
  };

  const getPriceOrFallback = async (
    token: string,
    fallback: bigint,
  ): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPriceOrFallback",
      args: [token as `0x${string}`, fallback],
    }) as Promise<bigint>;
  };

  const getPriceData = async (
    token: string,
  ): Promise<{ price: bigint; timestamp: bigint }> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPriceData",
      args: [token as `0x${string}`],
    }) as Promise<{ price: bigint; timestamp: bigint }>;
  };

  const getPriceHistory = async (token: string): Promise<bigint[]> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPriceHistory",
      args: [token as `0x${string}`],
    }) as Promise<bigint[]>;
  };

  return {
    setPendingPrice,
    confirmPrice,
    getPrice,
    getPriceOrFallback,
    getPriceData,
    getPriceHistory,
  };
}
