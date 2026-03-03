import { Address, Hash, keccak256, encodePacked } from "viem";
import {
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { useCallback, useState } from "react";
import { INTENT_ABI, getContractAddress } from "../lib/contracts";
import { useWallet } from "../hooks/useWallet";

export type IntentStatus =
  | "Open"
  | "Bidding"
  | "Assigned"
  | "Executing"
  | "Completed"
  | "Expired"
  | "Disputed";
export type BidStatus = "Pending" | "Accepted" | "Rejected";

export interface IntentData {
  requester: Address;
  description: string;
  structuredData: string;
  sourceToken: Address;
  sourceAmount: bigint;
  destToken: Address;
  minDestAmount: bigint;
  budget: bigint;
  deadline: bigint;
  status: IntentStatus;
  selectedSolver: Address;
  escrowId: Hash;
}

export interface BidData {
  solver: Address;
  price: bigint;
  estimatedTime: bigint;
  routeDetails: string;
  status: BidStatus;
  createdAt: bigint;
}

export interface UseIntentReturn {
  createIntent: (params: CreateIntentParams) => Promise<Hash | null>;
  submitBid: (
    intentId: Hash,
    price: bigint,
    estimatedTime: bigint,
    routeDetails: string,
  ) => Promise<Hash | null>;
  acceptBid: (intentId: Hash, solverIndex: number) => Promise<Hash | null>;
  rejectBid: (intentId: Hash, solverIndex: number) => Promise<Hash | null>;
  setEscrow: (intentId: Hash, escrowId: Hash) => Promise<Hash | null>;
  completeIntent: (intentId: Hash) => Promise<Hash | null>;
  getIntent: (intentId: Hash) => Promise<IntentData | null>;
  getBidCount: (intentId: Hash) => Promise<number>;
  getBid: (intentId: Hash, index: number) => Promise<BidData | null>;
  isPending: boolean;
  error: Error | null;
}

export interface CreateIntentParams {
  intentId: Hash;
  description: string;
  structuredData: string;
  sourceToken: Address;
  sourceAmount: bigint;
  destToken: Address;
  minDestAmount: bigint;
  budget: bigint;
  durationSeconds: number;
}

const INTENT_ABI = [
  {
    name: "createIntent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentId", type: "bytes32" },
      { name: "description", type: "string" },
      { name: "structuredData", type: "bytes" },
      { name: "sourceToken", type: "address" },
      { name: "sourceAmount", type: "uint256" },
      { name: "destToken", type: "address" },
      { name: "minDestAmount", type: "uint256" },
      { name: "budget", type: "uint256" },
      { name: "durationSeconds", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "submitBid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentId", type: "bytes32" },
      { name: "price", type: "uint256" },
      { name: "estimatedTime", type: "uint256" },
      { name: "routeDetails", type: "bytes" },
    ],
    outputs: [],
  },
  {
    name: "acceptBid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentId", type: "bytes32" },
      { name: "solverIndex", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "rejectBid",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentId", type: "bytes32" },
      { name: "solverIndex", type: "uint256" },
    ],
    outputs: [],
  },
  {
    name: "setEscrow",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "intentId", type: "bytes32" },
      { name: "escrowId", type: "bytes32" },
    ],
    outputs: [],
  },
  {
    name: "completeIntent",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "intentId", type: "bytes32" }],
    outputs: [],
  },
  {
    name: "getIntent",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "intentId", type: "bytes32" }],
    outputs: [
      {
        components: [
          { name: "requester", type: "address" },
          { name: "description", type: "string" },
          { name: "structuredData", type: "bytes" },
          { name: "sourceToken", type: "address" },
          { name: "sourceAmount", type: "uint256" },
          { name: "destToken", type: "address" },
          { name: "minDestAmount", type: "uint256" },
          { name: "budget", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "selectedSolver", type: "address" },
          { name: "escrowId", type: "bytes32" },
        ],
        name: "",
        type: "tuple",
      },
    ],
  },
] as const;

export function useIntent(contractAddress?: Address): UseIntentReturn {
  const { chainId, address: userAddress } = useWallet();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [error, setError] = useState<Error | null>(null);

  const getContract = useCallback(() => {
    if (!chainId || !contractAddress) throw new Error("Chain not connected");
    return contractAddress;
  }, [chainId, contractAddress]);

  const createIntent = useCallback(
    async (params: CreateIntentParams): Promise<Hash | null> => {
      try {
        const hash = await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "createIntent",
          args: [
            params.intentId,
            params.description,
            params.structuredData as `0x${string}`,
            params.sourceToken,
            params.sourceAmount,
            params.destToken,
            params.minDestAmount,
            params.budget,
            BigInt(params.durationSeconds),
          ],
          account: userAddress,
        });
        return hash;
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to create intent"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const submitBid = useCallback(
    async (
      intentId: Hash,
      price: bigint,
      estimatedTime: bigint,
      routeDetails: string,
    ): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "submitBid",
          args: [intentId, price, estimatedTime, routeDetails as `0x${string}`],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to submit bid"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const acceptBid = useCallback(
    async (intentId: Hash, solverIndex: number): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "acceptBid",
          args: [intentId, BigInt(solverIndex)],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to accept bid"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const rejectBid = useCallback(
    async (intentId: Hash, solverIndex: number): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "rejectBid",
          args: [intentId, BigInt(solverIndex)],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to reject bid"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const setEscrow = useCallback(
    async (intentId: Hash, escrowId: Hash): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "setEscrow",
          args: [intentId, escrowId],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to set escrow"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const completeIntent = useCallback(
    async (intentId: Hash): Promise<Hash | null> => {
      try {
        return await writeContractAsync({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "completeIntent",
          args: [intentId],
          account: userAddress,
        });
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Failed to complete intent"),
        );
        return null;
      }
    },
    [writeContractAsync, getContract, userAddress],
  );

  const getIntent = useCallback(
    async (intentId: Hash): Promise<IntentData | null> => {
      if (!publicClient) return null;
      try {
        const data = await publicClient.readContract({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "getIntent",
          args: [intentId],
        });
        return data as unknown as IntentData;
      } catch {
        return null;
      }
    },
    [publicClient, getContract],
  );

  const getBidCount = useCallback(
    async (intentId: Hash): Promise<number> => {
      if (!publicClient) return 0;
      try {
        const count = await publicClient.readContract({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "getBidCount",
          args: [intentId],
        });
        return Number(count);
      } catch {
        return 0;
      }
    },
    [publicClient, getContract],
  );

  const getBid = useCallback(
    async (intentId: Hash, index: number): Promise<BidData | null> => {
      if (!publicClient) return null;
      try {
        const data = await publicClient.readContract({
          address: getContract(),
          abi: INTENT_ABI,
          functionName: "getBid",
          args: [intentId, BigInt(index)],
        });
        return data as unknown as BidData;
      } catch {
        return null;
      }
    },
    [publicClient, getContract],
  );

  return {
    createIntent,
    submitBid,
    acceptBid,
    rejectBid,
    setEscrow,
    completeIntent,
    getIntent,
    getBidCount,
    getBid,
    isPending: false,
    error,
  };
}

export function generateIntentId(
  description: string,
  requester: Address,
): Hash {
  return keccak256(
    encodePacked(
      ["string", "address", "uint256"],
      [description, requester, BigInt(Math.floor(Date.now() / 1000))],
    ),
  );
}
