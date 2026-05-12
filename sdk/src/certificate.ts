import { KubernaSDK } from './index.js';

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

  async mint(params: MintCertificateParams): Promise<Certificate> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/certificates/mint',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as Certificate;
  }

  async verify(certificateId: string): Promise<CertificateVerification> {
    const response = await this.sdk.request({
      method: 'GET',
      path: `/certificates/${certificateId}/verify`,
    });
    return response.data as CertificateVerification;
  }

  async getByUser(userId: string): Promise<Certificate[]> {
    const response = await this.sdk.request({
      method: 'GET',
      path: '/certificates',
      data: { userId },
    });
    return (response.data as { certificates: Certificate[] }).certificates;
  }

  async getByCourse(courseId: string): Promise<Certificate[]> {
    const response = await this.sdk.request({
      method: 'GET',
      path: '/certificates',
      data: { courseId },
    });
    return (response.data as { certificates: Certificate[] }).certificates;
  }
}
