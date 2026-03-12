import * as fc from 'fast-check';
import { ethers } from 'hardhat';

/**
 * Property-based testing helpers for smart contract testing
 */

// Ethereum address generator
export const ethereumAddress = () =>
  fc
    .array(fc.integer({ min: 0, max: 255 }), { minLength: 20, maxLength: 20 })
    .map((bytes) => ethers.hexlify(bytes));

// Valid amount generator (positive BigInt)
export const validAmount = () =>
  fc.bigInt({ min: 1n, max: ethers.parseEther('1000000') });

// Small valid amount for gas-efficient testing
export const smallAmount = () =>
  fc.bigInt({ min: 1n, max: ethers.parseEther('100') });

// Timestamp generator (future timestamps)
export const futureTimestamp = () =>
  fc.integer({ min: Math.floor(Date.now() / 1000) + 60, max: 2147483647 });

// Duration in seconds (1 hour to 30 days)
export const validDuration = () =>
  fc.integer({ min: 3600, max: 2592000 });

// Token symbol generator
export const tokenSymbol = () =>
  fc.stringOf(fc.constantFrom('A', 'B', 'C', 'D', 'E', 'T', 'K', 'N'), {
    minLength: 3,
    maxLength: 5,
  });

// Token name generator
export const tokenName = () =>
  fc.stringOf(fc.constantFrom('Token', 'Coin', 'Asset', 'Currency'), {
    minLength: 1,
    maxLength: 1,
  }).map((arr) => arr[0] + ' Token');

// String generator for descriptions
export const description = () =>
  fc.string({ minLength: 10, maxLength: 200 });

// Hash generator (bytes32)
export const bytes32Hash = () =>
  fc
    .array(fc.integer({ min: 0, max: 255 }), { minLength: 32, maxLength: 32 })
    .map((bytes) => ethers.hexlify(bytes));

// Percentage generator (0-100)
export const percentage = () =>
  fc.integer({ min: 0, max: 100 });

// Rating generator (1-5 stars)
export const rating = () =>
  fc.integer({ min: 1, max: 5 });

// Chain ID generator
export const chainId = () =>
  fc.constantFrom(1, 137, 42161, 10, 43114, 56); // Ethereum, Polygon, Arbitrum, Optimism, Avalanche, BSC

// Price generator (in wei)
export const price = () =>
  fc.bigInt({ min: ethers.parseEther('0.001'), max: ethers.parseEther('10') });

// Gas limit generator
export const gasLimit = () =>
  fc.bigInt({ min: 21000n, max: 10000000n });

/**
 * Helper to run property-based tests with proper error handling
 */
export async function runPropertyTest<T>(
  property: fc.IProperty<T>,
  params?: fc.Parameters<T>
) {
  await fc.assert(property, {
    numRuns: 100, // Number of test cases to generate
    verbose: true,
    ...params,
  });
}

/**
 * Helper to generate test accounts
 */
export async function getTestAccounts(count: number = 10) {
  const signers = await ethers.getSigners();
  return signers.slice(0, count);
}

/**
 * Helper to advance blockchain time
 */
export async function advanceTime(seconds: number) {
  await ethers.provider.send('evm_increaseTime', [seconds]);
  await ethers.provider.send('evm_mine', []);
}

/**
 * Helper to advance blockchain to specific timestamp
 */
export async function advanceToTimestamp(timestamp: number) {
  const currentBlock = await ethers.provider.getBlock('latest');
  if (!currentBlock) throw new Error('Could not get latest block');
  
  const currentTimestamp = currentBlock.timestamp;
  if (timestamp > currentTimestamp) {
    await advanceTime(timestamp - currentTimestamp);
  }
}

/**
 * Helper to get current block timestamp
 */
export async function getCurrentTimestamp(): Promise<number> {
  const block = await ethers.provider.getBlock('latest');
  if (!block) throw new Error('Could not get latest block');
  return block.timestamp;
}

/**
 * Helper to mine blocks
 */
export async function mineBlocks(count: number) {
  for (let i = 0; i < count; i++) {
    await ethers.provider.send('evm_mine', []);
  }
}

/**
 * Helper to snapshot and revert blockchain state
 */
export class BlockchainSnapshot {
  private snapshotId: string | null = null;

  async take() {
    this.snapshotId = await ethers.provider.send('evm_snapshot', []);
  }

  async revert() {
    if (this.snapshotId) {
      await ethers.provider.send('evm_revert', [this.snapshotId]);
      this.snapshotId = null;
    }
  }
}

/**
 * Helper to expect transaction to revert with specific error
 */
export async function expectRevert(
  promise: Promise<any>,
  expectedError?: string
) {
  try {
    await promise;
    throw new Error('Expected transaction to revert but it succeeded');
  } catch (error: any) {
    if (expectedError) {
      if (!error.message.includes(expectedError)) {
        throw new Error(
          `Expected error "${expectedError}" but got "${error.message}"`
        );
      }
    }
  }
}
