import { simulateContract, writeContract, readContract } from "viem/actions";
import { getPublicClient, getWalletClient } from "../lib/wagmi";
import { crossChainRouterABI } from "../lib/contracts";

export interface CrossChainMessage {
  messageId: string;
  sourceChainId: bigint;
  destinationChainId: bigint;
  sender: string;
  recipient: string;
  token: string;
  amount: bigint;
  data: string;
  nonce: bigint;
  executed: boolean;
  timestamp: bigint;
}

export interface CrossChainRouterService {
  initiateTransfer: (
    destinationChainId: bigint,
    recipient: string,
    token: string,
    amount: bigint,
    minReceived: bigint,
  ) => Promise<`0x${string}`>;
  executeTransfer: (
    messageId: string,
    recipient: string,
    token: string,
    amount: bigint,
    minReceived: bigint,
  ) => Promise<`0x${string}`>;
  setChainSupport: (
    chainId: bigint,
    supported: boolean,
  ) => Promise<`0x${string}`>;
  setBridgeFee: (fee: bigint) => Promise<`0x${string}`>;
  setSlippageTolerance: (tolerance: bigint) => Promise<`0x${string}`>;
  getMinReceived: (amount: bigint) => Promise<bigint>;
  getMessage: (messageId: string) => Promise<CrossChainMessage>;
}

export function useCrossChainRouter(
  routerAddress: `0x${string}`,
): CrossChainRouterService {
  const initiateTransfer = async (
    destinationChainId: bigint,
    recipient: string,
    token: string,
    amount: bigint,
    minReceived: bigint,
  ): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "initiateTransfer",
      args: [
        destinationChainId,
        recipient,
        token as `0x${string}`,
        amount,
        minReceived,
      ],
    });

    return writeContract(walletClient, request);
  };

  const executeTransfer = async (
    messageId: string,
    recipient: string,
    token: string,
    amount: bigint,
    minReceived: bigint,
  ): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "executeTransfer",
      args: [
        messageId as `0x${string}`,
        recipient,
        token as `0x${string}`,
        amount,
        minReceived,
      ],
    });

    return writeContract(walletClient, request);
  };

  const setChainSupport = async (
    chainId: bigint,
    supported: boolean,
  ): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "setChainSupport",
      args: [chainId, supported],
    });

    return writeContract(walletClient, request);
  };

  const setBridgeFee = async (fee: bigint): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "setBridgeFee",
      args: [fee],
    });

    return writeContract(walletClient, request);
  };

  const setSlippageTolerance = async (
    tolerance: bigint,
  ): Promise<`0x${string}`> => {
    const walletClient = await getWalletClient();
    if (!walletClient) throw new Error("Wallet not connected");

    const { request } = await simulateContract(walletClient, {
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "setSlippageTolerance",
      args: [tolerance],
    });

    return writeContract(walletClient, request);
  };

  const getMinReceived = async (amount: bigint): Promise<bigint> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "getMinReceived",
      args: [amount],
    }) as Promise<bigint>;
  };

  const getMessage = async (messageId: string): Promise<CrossChainMessage> => {
    const publicClient = await getPublicClient();
    return publicClient.readContract({
      address: routerAddress,
      abi: crossChainRouterABI,
      functionName: "getMessage",
      args: [messageId as `0x${string}`],
    }) as Promise<CrossChainMessage>;
  };

  return {
    initiateTransfer,
    executeTransfer,
    setChainSupport,
    setBridgeFee,
    setSlippageTolerance,
    getMinReceived,
    getMessage,
  };
}
