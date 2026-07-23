import { ethers } from 'ethers';
import { WalletManager } from '../src/wallet.js';

describe('WalletManager', () => {
  let mockSDK: any;
  let walletManager: WalletManager;

  beforeEach(() => {
    mockSDK = {
      getWallet: jest.fn().mockReturnValue({
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        sendTransaction: jest.fn().mockResolvedValue({
          hash: '0xabc',
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          to: '0xRecipient0000000000000000000000000000',
          wait: jest.fn().mockResolvedValue({ blockNumber: 100, status: 1 }),
        }),
      }),
      getProvider: jest.fn().mockReturnValue({
        getBalance: jest.fn().mockResolvedValue(ethers.parseEther('1.5')),
        getTransactionCount: jest.fn().mockResolvedValue(5),
      }),
    };

    walletManager = new WalletManager(mockSDK);
  });

  it('getAddress returns wallet address', () => {
    expect(walletManager.getAddress()).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0');
  });

  it('getBalance returns formatted ether', async () => {
    const balance = await walletManager.getBalance();
    expect(balance).toBe('1.5');
  });

  it('sendTransaction returns transaction result', async () => {
    const result = await walletManager.sendTransaction(
      '0xRecipient0000000000000000000000000000',
      '0.5'
    );
    expect(result.hash).toBe('0xabc');
    expect(result.status).toBe(1);
  });

  it('getTransactionCount returns count', async () => {
    const count = await walletManager.getTransactionCount();
    expect(count).toBe(5);
  });

  it('getBalanceInUsd returns ETH balance', async () => {
    const usd = await walletManager.getBalanceInUsd();
    expect(usd).toBe('1.5');
  });
});
