import { Address, Hash } from "viem";
import { usePublicClient, useWalletClient, useWriteContract } from "wagmi";
import { useCallback, useState } from "react";
import { useWallet } from "../hooks/useWallet";

export type SubStatus = "None" | "Active" | "Paused" | "Cancelled" | "Expired";
export type PlanType = "Monthly" | "Annual";

export interface SubscriptionData {
  subscriber: Address;
  planId: bigint;
  startTime: bigint;
  nextPaymentTime: bigint;
  amountPaid: bigint;
  status: SubStatus;
}

export interface PlanData {
  name: string;
  token: Address;
  price: bigint;
  planType: PlanType;
  durationSeconds: bigint;
  active: boolean;
}

export interface UseSubscriptionReturn {
  createPlan: (
    name: string,
    token: Address,
    price: bigint,
    planType: PlanType,
    durationSeconds: number,
  ) => Promise<Hash | null>;
  subscribe: (planId: bigint) => Promise<Hash | null>;
  renew: (planId: bigint) => Promise<Hash | null>;
  cancelSubscription: (planId: bigint) => Promise<Hash | null>;
  pauseSubscription: (planId: bigint) => Promise<Hash | null>;
  resumeSubscription: (planId: bigint) => Promise<Hash | null>;
  getSubscription: (
    user: Address,
    planId: bigint,
  ) => Promise<SubscriptionData | null>;
  getPlan: (planId: bigint) => Promise<PlanData | null>;
  isActive: (user: Address, planId: bigint) => Promise<boolean>;
  isPending: boolean;
  error: Error | null;
}

const SUBSCRIPTION_ABI = [
  {
    name: "createPlan",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "name", type: "string" },
      { name: "token", type: "address" },
      { name: "price", type: "uint256" },
      { name: "planType", type: "uint8" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "subscribe",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "renew",
    type: "function",
    stateMutability: "payable",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "cancelSubscription",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "pauseSubscription",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "resumeSubscription",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [],
  },
  {
    name: "getSubscription",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "planId", type: "uint256" },
    ],
    outputs: [
      {
        components: [
          { name: "subscriber", type: "address" },
          { name: "planId", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "nextPaymentTime", type: "uint256" },
          { name: "amountPaid", type: "uint256" },
          { name: "status", type: "uint8" },
        ],
        name: "",
        type: "tuple",
      },
    ],
  },
  {
    name: "getPlan",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "planId", type: "uint256" }],
    outputs: [
      {
        components: [
          { name: "name", type: "string" },
          { name: "token", type: "address" },
          { name: "price", type: "uint256" },
          { name: "planType", type: "uint8" },
          { name: "durationSeconds", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        name: "",
        type: "tuple",
      },
    ],
  },
  {
    name: "isActive",
    type: "function",
    stateMutability: "view",
    inputs: [
      { name: "user", type: "address" },
      { name: "planId", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export function useSubscription(
  contractAddress: Address,
): UseSubscriptionReturn {
  const { address: userAddress } = useWallet();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [error, setError] = useState<Error | null>(null);

  const getContract = () => contractAddress;

  const createPlan = useCallback(
    async (
      name: string,
      token: Address,
      price: bigint,
      planType: PlanType,
      durationSeconds: number,
    ): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "createPlan",
          args: [
            name,
            token,
            price,
            planType === "Monthly" ? 0 : 1,
            BigInt(durationSeconds),
          ],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create plan"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const subscribe = useCallback(
    async (planId: bigint): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "subscribe",
          args: [planId],
          account: userAddress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to subscribe"));
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const renew = useCallback(
    async (planId: bigint): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "renew",
          args: [planId],
          account: userAddress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to renew"));
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const cancelSubscription = useCallback(
    async (planId: bigint): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "cancelSubscription",
          args: [planId],
          account: userAddress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to cancel"));
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const pauseSubscription = useCallback(
    async (planId: bigint): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "pauseSubscription",
          args: [planId],
          account: userAddress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to pause"));
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const resumeSubscription = useCallback(
    async (planId: bigint): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "resumeSubscription",
          args: [planId],
          account: userAddress,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to resume"));
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const getSubscription = useCallback(
    async (user: Address, planId: bigint): Promise<SubscriptionData | null> => {
      if (!publicClient) return null;
      try {
        return (await publicClient.readContract({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "getSubscription",
          args: [user, planId],
        })) as unknown as SubscriptionData;
      } catch {
        return null;
      }
    },
    [publicClient, getContract],
  );

  const getPlan = useCallback(
    async (planId: bigint): Promise<PlanData | null> => {
      if (!publicClient) return null;
      try {
        return (await publicClient.readContract({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "getPlan",
          args: [planId],
        })) as unknown as PlanData;
      } catch {
        return null;
      }
    },
    [publicClient, getContract],
  );

  const isActive = useCallback(
    async (user: Address, planId: bigint): Promise<boolean> => {
      if (!publicClient) return false;
      try {
        return (await publicClient.readContract({
          address: getContract(),
          abi: SUBSCRIPTION_ABI,
          functionName: "isActive",
          args: [user, planId],
        })) as boolean;
      } catch {
        return false;
      }
    },
    [publicClient, getContract],
  );

  return {
    createPlan,
    subscribe,
    renew,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    getSubscription,
    getPlan,
    isActive,
    isPending: false,
    error,
  };
}
