import { Address, Hash, keccak256, toHex, encodePacked } from 'viem';
import {
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useReadContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { useCallback, useState } from 'react';
import { ESCROW_ABI, CONTRACT_ADDRESSES } from '../lib/contracts';
import { useWallet } from '../hooks/useWallet';
import { getContractAddress } from '../lib/contracts';

export enum EscrowStatusEnum {
  None = 0,
  Funded = 1,
  Assigned = 2,
  Completed = 3,
  Disputed = 4,
  Released = 5,
  Refunded = 6,
  Expired = 7,
}

export type EscrowStatus =
  | 'None'
  | 'Funded'
  | 'Assigned'
  | 'Completed'
  | 'Disputed'
  | 'Released'
  | 'Refunded'
  | 'Expired';

export interface EscrowData {
  requester: Address;
  executor: Address;
  token: Address;
  amount: bigint;
  fee: bigint;
  deadline: bigint;
  status: EscrowStatus;
  intentId: string;
}

interface RawEscrowData {
  requester: Address;
  executor: Address;
  token: Address;
  amount: bigint;
  fee: bigint;
  deadline: bigint;
  status: bigint;
  intentId: string;
}

export interface CreateEscrowParams {
  intentId: string;
  token: Address;
  amount: bigint;
  durationSeconds: number;
}

export interface UseEscrowReturn {
  createEscrow: (params: CreateEscrowParams) => Promise<Hash | null>;
  fundEscrow: (escrowId: `0x${string}`) => Promise<Hash | null>;
  assignExecutor: (escrowId: `0x${string}`, executor: Address) => Promise<Hash | null>;
  submitCompletion: (escrowId: `0x${string}`, proofHash: Hash) => Promise<Hash | null>;
  releaseFunds: (escrowId: `0x${string}`) => Promise<Hash | null>;
  raiseDispute: (escrowId: `0x${string}`, reason: string) => Promise<Hash | null>;

  getEscrow: (escrowId: `0x${string}`) => Promise<EscrowData | null>;
  getEscrowStatus: (escrowId: `0x${string}`) => Promise<EscrowStatus | null>;

  isPending: boolean;
  isConfirming: boolean;
  error: Error | null;
}

export function useEscrow(): UseEscrowReturn {
  const { chainId, address: userAddress } = useWallet();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const { writeContractAsync, isPending, error: writeError } = useWriteContract();

  const [error, setError] = useState<Error | null>(null);

  const getContractAddressForChain = useCallback(() => {
    if (!chainId) throw new Error('Chain not connected');
    return getContractAddress(chainId, 'escrow');
  }, [chainId]);

  const mapStatus = (statusNum: number): EscrowStatus => {
    const statusMap: Record<number, EscrowStatus> = {
      0: 'None',
      1: 'Funded',
      2: 'Assigned',
      3: 'Completed',
      4: 'Disputed',
      5: 'Released',
      6: 'Refunded',
      7: 'Expired',
    };
    return statusMap[statusNum] || 'None';
  };

  const createEscrow = useCallback(
    async (params: CreateEscrowParams): Promise<Hash | null> => {
      if (!walletClient || !userAddress) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'createEscrow',
          args: [params.intentId, params.token, params.amount, BigInt(params.durationSeconds)],
          account: userAddress,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to create escrow'));
        return null;
      }
    },
    [walletClient, userAddress, writeContractAsync, getContractAddressForChain]
  );

  const fundEscrow = useCallback(
    async (escrowId: `0x${string}`): Promise<Hash | null> => {
      if (!walletClient || !userAddress || !publicClient) {
        setError(new Error('Required clients not available'));
        return null;
      }

      try {
        const rawData = (await publicClient.readContract({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'getEscrow',
          args: [escrowId],
        })) as RawEscrowData;

        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'fundEscrow',
          args: [escrowId],
          account: userAddress,
          value: rawData.amount,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fund escrow'));
        return null;
      }
    },
    [walletClient, userAddress, writeContractAsync, getContractAddressForChain, publicClient]
  );

  const assignExecutor = useCallback(
    async (escrowId: `0x${string}`, executor: Address): Promise<Hash | null> => {
      if (!walletClient || !userAddress) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'assignExecutor',
          args: [escrowId, executor],
          account: userAddress,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to assign executor'));
        return null;
      }
    },
    [walletClient, userAddress, writeContractAsync, getContractAddressForChain]
  );

  const submitCompletion = useCallback(
    async (escrowId: `0x${string}`, proofHash: Hash): Promise<Hash | null> => {
      if (!walletClient) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'submitCompletion',
          args: [escrowId, proofHash],
          account: walletClient.account.address,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to submit completion'));
        return null;
      }
    },
    [walletClient, writeContractAsync, getContractAddressForChain]
  );

  const releaseFunds = useCallback(
    async (escrowId: `0x${string}`): Promise<Hash | null> => {
      if (!walletClient || !userAddress) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'releaseFunds',
          args: [escrowId],
          account: userAddress,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to release funds'));
        return null;
      }
    },
    [walletClient, userAddress, writeContractAsync, getContractAddressForChain]
  );

  const raiseDispute = useCallback(
    async (escrowId: `0x${string}`, reason: string): Promise<Hash | null> => {
      if (!walletClient || !userAddress) {
        setError(new Error('Wallet not connected'));
        return null;
      }

      try {
        const hash = await writeContractAsync({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'raiseDispute',
          args: [escrowId, reason],
          account: userAddress,
        });

        return hash;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to raise dispute'));
        return null;
      }
    },
    [walletClient, userAddress, writeContractAsync, getContractAddressForChain]
  );

  const getEscrow = useCallback(
    async (escrowId: `0x${string}`): Promise<EscrowData | null> => {
      if (!publicClient) return null;

      try {
        const data = (await publicClient.readContract({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'getEscrow',
          args: [escrowId],
        })) as RawEscrowData;

        return {
          requester: data.requester,
          executor: data.executor,
          token: data.token,
          amount: data.amount,
          fee: data.fee,
          deadline: data.deadline,
          status: mapStatus(Number(data.status)),
          intentId: data.intentId,
        };
      } catch (err) {
        console.error('Failed to get escrow:', err);
        return null;
      }
    },
    [publicClient, getContractAddressForChain]
  );

  const getEscrowStatus = useCallback(
    async (escrowId: `0x${string}`): Promise<EscrowStatus | null> => {
      if (!publicClient) return null;

      try {
        const statusNum = (await publicClient.readContract({
          address: getContractAddressForChain() as Address,
          abi: ESCROW_ABI,
          functionName: 'getEscrowStatus',
          args: [escrowId],
        })) as bigint;

        return mapStatus(Number(statusNum));
      } catch (err) {
        console.error('Failed to get escrow status:', err);
        return null;
      }
    },
    [publicClient, getContractAddressForChain]
  );

  return {
    createEscrow,
    fundEscrow,
    assignExecutor,
    submitCompletion,
    releaseFunds,
    raiseDispute,
    getEscrow,
    getEscrowStatus,
    isPending,
    isConfirming: false,
    error,
  };
}

export function generateEscrowId(
  intentId: string,
  requester: Address,
  timestamp: bigint
): `0x${string}` {
  return keccak256(
    encodePacked(['string', 'address', 'uint256'], [intentId, requester, timestamp])
  );
}

export function generateProofHash(data: string): Hash {
  return keccak256(encodePacked(['string'], [data]));
}
