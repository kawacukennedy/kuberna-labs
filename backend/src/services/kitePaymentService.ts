import { ethers } from 'ethers';
import { prisma } from '../utils/prisma';
import { kitePassportService } from './kiteService';
import logger from '../utils/logger';

export interface X402PaymentRequest {
  maxAmountRequired: string;
  asset: string;
  network: string;
  payTo: string;
  resource: string;
  description: string;
  maxTimeoutSeconds: number;
  scheme: string;
}

export interface X402PaymentAuthorization {
  paymentId: string;
  sessionId: string;
  amount: string;
  asset: string;
  network: string;
  payTo: string;
  nonce: string;
  expiresAt: number;
  signature: string;
  authorization: Record<string, unknown>;
}

export interface FacilitatorSettleResponse {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class KitePaymentService {
  async parseX402Response(body: Record<string, unknown>): Promise<X402PaymentRequest | null> {
    try {
      const accepts = body.accepts as Array<Record<string, unknown>> | undefined;
      if (!accepts || accepts.length === 0) return null;

      const paymentTerm = accepts[0];
      return {
        maxAmountRequired: paymentTerm.maxAmountRequired as string,
        asset: paymentTerm.asset as string,
        network: paymentTerm.network as string,
        payTo: paymentTerm.payTo as string,
        resource: paymentTerm.resource as string,
        description: paymentTerm.description as string,
        maxTimeoutSeconds: paymentTerm.maxTimeoutSeconds as number,
        scheme: paymentTerm.scheme as string,
      };
    } catch (error) {
      logger.error('Failed to parse x402 response', { error: String(error) });
      return null;
    }
  }

  async createKitePaymentRecord(params: {
    paymentId: string;
    sessionId?: string;
    agentKiteDid?: string;
    kiteWalletAddr?: string;
    amount: string;
    asset?: string;
    network?: string;
    expiresAt?: Date;
  }): Promise<void> {
    await prisma.kitePayment.create({
      data: {
        paymentId: params.paymentId,
        sessionId: params.sessionId,
        agentKiteDid: params.agentKiteDid,
        kiteWalletAddr: params.kiteWalletAddr,
        amount: params.amount,
        asset: params.asset,
        network: params.network || 'kite-testnet',
        status: 'SESSION_CREATED',
        expiresAt: params.expiresAt,
      },
    });
  }

  async updatePaymentAuthorization(
    kitePaymentId: string,
    authorization: Record<string, unknown>,
    status: string
  ): Promise<void> {
    await prisma.kitePayment.update({
      where: { id: kitePaymentId },
      data: {
        authorization: JSON.parse(JSON.stringify(authorization)),
        status: status as any,
      },
    });
  }

  async settleViaFacilitator(
    authorization: Record<string, unknown>,
    signature: string,
    network: string
  ): Promise<FacilitatorSettleResponse> {
    try {
      const config = kitePassportService.getConfig();
      const resp = await fetch(`${config.facilitatorUrl}/v2/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorization,
          signature,
          network,
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.text();
        return { success: false, error: errBody };
      }

      const data = await resp.json() as Record<string, string>;
      return {
        success: true,
        txHash: data.txHash || data.transactionHash,
      };
    } catch (error) {
      logger.error('Facilitator settlement failed', { error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  async verifyPaymentOnChain(txHash: string): Promise<{
    verified: boolean;
    toAddress: string;
    amount: string;
    blockNumber: number;
  } | null> {
    try {
      const provider = kitePassportService.getProvider();
      const receipt = await provider.getTransactionReceipt(txHash);

      if (!receipt || receipt.status !== 1) {
        return null;
      }

      const tx = await provider.getTransaction(txHash);

      if (!tx) return null;

      return {
        verified: true,
        toAddress: tx.to || '',
        amount: ethers.formatEther(tx.value),
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('On-chain payment verification failed', { error: String(error), txHash });
      return null;
    }
  }

  async markSettled(kitePaymentId: string, txHash: string): Promise<void> {
    await prisma.kitePayment.update({
      where: { id: kitePaymentId },
      data: {
        status: 'PAYMENT_SETTLED',
        settlementTx: txHash,
        facilitatorResp: { txHash, settledAt: new Date().toISOString() },
        settledAt: new Date(),
      },
    });
  }

  async markCompleted(kitePaymentId: string): Promise<void> {
    await prisma.kitePayment.update({
      where: { id: kitePaymentId },
      data: {
        status: 'COMPLETED',
      },
    });
  }

  async getKitePayment(kitePaymentId: string) {
    return prisma.kitePayment.findUnique({
      where: { id: kitePaymentId },
      include: { payment: true },
    });
  }

  async getKitePaymentsBySession(sessionId: string) {
    return prisma.kitePayment.findMany({
      where: { sessionId },
      include: { payment: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const kitePaymentService = new KitePaymentService();
