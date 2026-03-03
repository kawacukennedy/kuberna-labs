import { Address, Hash, keccak256, encodePacked } from 'viem';
import { usePublicClient, useWalletClient, useWriteContract, useReadContract } from 'wagmi';
import { useCallback, useState } from 'react';
import { CERTIFICATE_ABI, getContractAddress } from '../lib/contracts';
import { useWallet } from '../hooks/useWallet';

export interface CertificateData {
  recipientName: string;
  courseTitle: string;
  courseId: string;
  completionDate: bigint;
  instructorName: string;
  verificationHash: string;
  isValid: boolean;
}

export interface MintCertificateParams {
  recipient: Address;
  recipientName: string;
  courseTitle: string;
  courseId: string;
  instructorName: string;
}

export interface UseCertificateReturn {
  mintCertificate: (params: MintCertificateParams) => Promise<Hash | null>;
  verifyCertificate: (tokenId: bigint) => Promise<boolean>;
  getCertificateDetails: (tokenId: bigint) => Promise<CertificateData | null>;
  getUserCertificates: (user: Address) => Promise<bigint[]>;
  
  isPending: boolean;
  error: Error | null;
}

export function useCertificate(): UseCertificateReturn {
  const { chainId, address: userAddress } = useWallet();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [error, setError] = useState<Error | null>(null);
  
  const getContractAddressForChain = useCallback(() => {
    if (!chainId) throw new Error('Chain not connected');
    return getContractAddress(chainId, 'certificate');
  }, [chainId]);
  
  const generateVerificationHash = useCallback((
    recipient: Address,
    courseId: string,
    completionDate: bigint
  ): string => {
    return keccak256(
      encodePacked(
        ['address', 'string', 'uint256', 'uint256'],
        [recipient, courseId, completionDate, BigInt(Math.floor(Math.random() * 1000000))]
      )
    );
  }, []);
  
  const mintCertificate = useCallback(async (
    params: MintCertificateParams
  ): Promise<Hash | null> => {
    if (!userAddress) {
      setError(new Error('Wallet not connected'));
      return null;
    }
    
    try {
      const completionDate = BigInt(Math.floor(Date.now() / 1000));
      const verificationHash = generateVerificationHash(
        params.recipient,
        params.courseId,
        completionDate
      );
      
      const hash = await writeContractAsync({
        address: getContractAddressForChain() as Address,
        abi: CERTIFICATE_ABI,
        functionName: 'mintCertificate',
        args: [
          params.recipient,
          params.recipientName,
          params.courseTitle,
          params.courseId,
          params.instructorName,
          verificationHash,
        ],
        account: userAddress,
      });
      
      return hash;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mint certificate'));
      return null;
    }
  }, [userAddress, writeContractAsync, getContractAddressForChain, generateVerificationHash]);
  
  const verifyCertificate = useCallback(async (tokenId: bigint): Promise<boolean> => {
    if (!publicClient) return false;
    
    try {
      const isValid = await publicClient.readContract({
        address: getContractAddressForChain() as Address,
        abi: CERTIFICATE_ABI,
        functionName: 'verifyCertificate',
        args: [tokenId],
      });
      
      return isValid as boolean;
    } catch (err) {
      console.error('Failed to verify certificate:', err);
      return false;
    }
  }, [publicClient, getContractAddressForChain]);
  
  const getCertificateDetails = useCallback(async (
    tokenId: bigint
  ): Promise<CertificateData | null> => {
    if (!publicClient) return null;
    
    try {
      const details = await publicClient.readContract({
        address: getContractAddressForChain() as Address,
        abi: CERTIFICATE_ABI,
        functionName: 'getCertificateDetails',
        args: [tokenId],
      }) as CertificateData;
      
      return details;
    } catch (err) {
      console.error('Failed to get certificate details:', err);
      return null;
    }
  }, [publicClient, getContractAddressForChain]);
  
  const getUserCertificates = useCallback(async (user: Address): Promise<bigint[]> => {
    if (!publicClient) return [];
    
    try {
      const tokenIds = await publicClient.readContract({
        address: getContractAddressForChain() as Address,
        abi: CERTIFICATE_ABI,
        functionName: 'getUserCertificates',
        args: [user],
      });
      
      return tokenIds as bigint[];
    } catch (err) {
      console.error('Failed to get user certificates:', err);
      return [];
    }
  }, [publicClient, getContractAddressForChain]);
  
  return {
    mintCertificate,
    verifyCertificate,
    getCertificateDetails,
    getUserCertificates,
    isPending: false,
    error,
  };
}

export function generateCertificateVerificationUrl(chainId: number, tokenId: bigint): string {
  const baseUrl = 'https://kuberna.africa/verify';
  return `${baseUrl}/${chainId}/${tokenId}`;
}
