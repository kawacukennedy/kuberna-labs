import { KubernaSDK } from './index.js';
import { KubernaError } from './errors.js';

export interface MintCertificateParams {
  recipientAddress: string;
  courseId: string;
  metadata?: Record<string, unknown>;
}

export interface Certificate {
  id: string;
  tokenId: string;
  recipient: string;
  courseId: string;
  verificationHash: string;
  chain: string;
  transactionHash: string;
  mintedAt: string;
}

export interface CertificateVerification {
  valid: boolean;
  certificate?: Certificate;
  issuer: string;
  timestamp: string;
}

export class CertificateManager {
  constructor(private sdk: KubernaSDK) {}

  async mint(_params: MintCertificateParams): Promise<Certificate> {
    throw new KubernaError('Certificate minting is not yet exposed via the API. Certificates are issued through the identity router (/api/identity/:agentId/issue-certificates) upon task completion.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async verify(certificateId: string): Promise<CertificateVerification> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/identity/verify-cert',
      data: { cert: { id: certificateId } } as Record<string, unknown>,
    });
    return response.data as CertificateVerification;
  }

  async getByUser(_userId: string): Promise<Certificate[]> {
    throw new KubernaError('Certificate listing by user is not yet exposed via the API. Use /api/identity/:agentId/certificates instead.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async getByCourse(_courseId: string): Promise<Certificate[]> {
    throw new KubernaError('Certificate listing by course is not yet exposed via the API. Use /api/identity/:agentId/certificates instead.', 'FEATURE_NOT_AVAILABLE', 501);
  }
}
