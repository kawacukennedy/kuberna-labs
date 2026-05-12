import { KubernaSDK } from './index.js';
import { ethers } from 'ethers';

export interface WalletInfo {
  address: string;
  balance: string;
  chainId: number;
  isConnected: boolean;
}

export interface TransactionResult {
  hash: string;
  from: string;
  to: string;
  value: string;
  blockNumber?: number;
  status?: number;
}

export class WalletManager {
  constructor(private sdk: KubernaSDK) {}

  getAddress(): string | undefined {
    return this.sdk.getWallet()?.address;
  }

  async getBalance(address?: string): Promise<string> {
    const addr = address || this.getAddress();
    if (!addr) throw new Error('No address available. Provide an address or initialize with a private key.');
    const balance = await this.sdk.getProvider().getBalance(addr);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to: string, amount: string): Promise<TransactionResult> {
    const wallet = this.sdk.getWallet();
    if (!wallet) throw new Error('Wallet not initialized. Provide a private key in SDK config.');
    const tx = await wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });
    const receipt = await tx.wait();
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to || to,
      value: amount,
      blockNumber: receipt?.blockNumber ?? undefined,
      status: receipt?.status ?? undefined,
    };
  }

  async getTransactionCount(address?: string): Promise<number> {
    const addr = address || this.getAddress();
    if (!addr) throw new Error('No address available.');
    return this.sdk.getProvider().getTransactionCount(addr);
  }

  async getBalanceInUsd(address?: string): Promise<string> {
    const ethBalance = await this.getBalance(address);
    return ethBalance; // would multiply by ETH/USD price in production
  }
}
