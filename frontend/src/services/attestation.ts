import { simulateContract, writeContract, readContract } from "@wagmi/core";
import { config } from "../lib/wagmi";
import { attestationABI } from "../lib/contracts";

export interface AttestationService {
  attest: (
    schema: string,
    recipient: string,
    expirationTime: bigint,
    data: string,
  ) => Promise<`0x${string}`>;
  attestBySignature: (
    schema: string,
    recipient: string,
    expirationTime: bigint,
    data: string,
    signature: string,
  ) => Promise<`0x${string}`>;
  revoke: (attestationId: string) => Promise<`0x${string}`>;
  verify: (attestationId: string) => Promise<boolean>;
  getAttestation: (attestationId: string) => Promise<AttestationData>;
  getIssuerAttestations: (issuer: string) => Promise<string[]>;
  getRecipientAttestations: (recipient: string) => Promise<string[]>;
}

export interface AttestationData {
  schema: string;
  recipient: string;
  issuer: string;
  expirationTime: bigint;
  issuedAt: bigint;
  data: string;
  revoked: boolean;
}

export function useAttestation(
  attestationAddress: `0x${string}`,
): AttestationService {
  const attest = async (
    schema: string,
    recipient: string,
    expirationTime: bigint,
    data: string,
  ): Promise<`0x${string}`> => {
    const { request } = await simulateContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "attest",
      args: [
        schema as `0x${string}`,
        recipient as `0x${string}`,
        expirationTime,
        data as `0x${string}`,
      ],
    });

    return writeContract(config as any, request);
  };

  const attestBySignature = async (
    schema: string,
    recipient: string,
    expirationTime: bigint,
    data: string,
    signature: string,
  ): Promise<`0x${string}`> => {
    const { request } = await simulateContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "attestBySignature",
      args: [
        schema as `0x${string}`,
        recipient as `0x${string}`,
        expirationTime,
        data as `0x${string}`,
        signature as `0x${string}`,
      ],
    });

    return writeContract(config as any, request);
  };

  const revoke = async (attestationId: string): Promise<`0x${string}`> => {
    const { request } = await simulateContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "revoke",
      args: [attestationId as `0x${string}`],
    });

    return writeContract(config as any, request);
  };

  const verify = async (attestationId: string): Promise<boolean> => {
    return readContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "verify",
      args: [attestationId as `0x${string}`],
    }) as Promise<boolean>;
  };

  const getAttestation = async (
    attestationId: string,
  ): Promise<AttestationData> => {
    return readContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "getAttestation",
      args: [attestationId as `0x${string}`],
    }) as Promise<AttestationData>;
  };

  const getIssuerAttestations = async (issuer: string): Promise<string[]> => {
    return readContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "getIssuerAttestations",
      args: [issuer as `0x${string}`],
    }) as Promise<string[]>;
  };

  const getRecipientAttestations = async (
    recipient: string,
  ): Promise<string[]> => {
    return readContract(config as any, {
      address: attestationAddress,
      abi: attestationABI,
      functionName: "getRecipientAttestations",
      args: [recipient as `0x${string}`],
    }) as Promise<string[]>;
  };

  return {
    attest,
    attestBySignature,
    revoke,
    verify,
    getAttestation,
    getIssuerAttestations,
    getRecipientAttestations,
  };
}
