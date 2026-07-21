import { validateEthAddress } from '../src/utils/address';
import { ethers } from 'ethers';

describe('validateEthAddress', () => {
  it('returns checksummed address for a valid lowercased address', () => {
    const raw = '0x742d35cc6634c0532925a3b844bc454e4438f44e';
    const checksummed = ethers.getAddress(raw);
    expect(validateEthAddress(raw)).toBe(checksummed);
  });

  it('throws for an invalid address', () => {
    expect(() => validateEthAddress('0x123')).toThrow(/Invalid/);
  });

  it('accepts ZeroAddress and ETH token symbol', () => {
    expect(validateEthAddress(ethers.ZeroAddress)).toBe(ethers.ZeroAddress);
    expect(validateEthAddress('ETH')).toBe('ETH');
  });
});
