import { KubernaSDK } from "./index.js";
import { ethers } from "ethers";

export class BlockchainManager {
  constructor(private sdk: KubernaSDK) {}

  async getBalance(address: string): Promise<string> {
    const balance = await this.sdk.getProvider().getBalance(address);
    return ethers.formatEther(balance);
  }

  async sendTransaction(to: string, amount: string): Promise<ethers.TransactionResponse> {
    const wallet = this.sdk.getWallet();
    if (!wallet) {
      throw new Error("Wallet not initialized. Provide a private key in SDK config.");
    }
    return wallet.sendTransaction({
      to,
      value: ethers.parseEther(amount),
    });
  }
}
