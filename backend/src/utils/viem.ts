import { verifyMessage as viemVerifyMessage } from 'viem';

export interface VerifyMessageParams {
  address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
}

export async function verifyMessage(params: VerifyMessageParams): Promise<boolean> {
  try {
    return await viemVerifyMessage(params);
  } catch {
    return false;
  }
}

export const viem = { verifyMessage };
