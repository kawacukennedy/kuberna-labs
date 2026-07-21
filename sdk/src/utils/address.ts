import { ethers } from 'ethers';

export function validateEthAddress(address: string, name = 'address'): string {
  if (!address) {
    throw new Error(`${name} is required`);
  }

  // Allow the zero address (native token placeholder) and the 'ETH' symbol
  if (address === ethers.ZeroAddress) return address;
  if (address.toUpperCase() === 'ETH') return address;

  try {
    // ethers.getAddress validates the address and returns the checksummed address
    return ethers.getAddress(address);
  } catch (e) {
    throw new Error(`Invalid ${name}: ${address}`);
  }
}
