import { simulateContract, writeContract, readContract } from "@wagmi/core";
import { config } from "../lib/wagmi";
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
    const { request } = await simulateContract(config as any, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "setPendingPrice",
      args: [token as `0x${string}`, price],
    });

    return writeContract(config as any, request);
  };

  const confirmPrice = async (token: string): Promise<`0x${string}`> => {
    const { request } = await simulateContract(config as any, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "confirmPrice",
      args: [token as `0x${string}`],
    });

    return writeContract(config as any, request);
  };

  const getPrice = async (token: string): Promise<bigint> => {
    return readContract(config as any, {
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
    return readContract(config as any, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPriceOrFallback",
      args: [token as `0x${string}`, fallback],
    }) as Promise<bigint>;
  };

  const getPriceData = async (
    token: string,
  ): Promise<{ price: bigint; timestamp: bigint }> => {
    const data = await readContract(config as any, {
      address: oracleAddress,
      abi: priceOracleABI,
      functionName: "getPriceData",
      args: [token as `0x${string}`],
    }) as any;
    
    return {
      price: data[0],
      timestamp: data[1],
    };
  };

  const getPriceHistory = async (token: string): Promise<bigint[]> => {
    return readContract(config as any, {
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
