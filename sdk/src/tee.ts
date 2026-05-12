import { KubernaSDK } from './index.js';

export interface CreateEnclaveParams {
  name: string;
  image: string;
  memory?: number;
  cpu?: number;
  environment?: Record<string, string>;
}

export interface Enclave {
  id: string;
  name: string;
  status: string;
  image: string;
  memory: number;
  cpu: number;
  attestationReport?: string;
  createdAt: string;
}

export interface AttestationReport {
  enclaveId: string;
  report: string;
  verified: boolean;
  timestamp: string;
  measurements: {
    mrEnclave: string;
    mrSigner: string;
    isvProdID: string;
    isvSVN: string;
  };
}

export class TeeManager {
  constructor(private sdk: KubernaSDK) {}

  async createEnclave(params: CreateEnclaveParams): Promise<Enclave> {
    const response = await this.sdk.request({
      method: 'POST',
      path: '/tee/enclaves',
      data: params as unknown as Record<string, unknown>,
    });
    return response.data as Enclave;
  }

  async getEnclave(id: string): Promise<Enclave> {
    const response = await this.sdk.request({ method: 'GET', path: `/tee/enclaves/${id}` });
    return response.data as Enclave;
  }

  async listEnclaves(): Promise<Enclave[]> {
    const response = await this.sdk.request({ method: 'GET', path: '/tee/enclaves' });
    return (response.data as { enclaves: Enclave[] }).enclaves;
  }

  async verifyAttestation(enclaveId: string): Promise<AttestationReport> {
    const response = await this.sdk.request({
      method: 'POST',
      path: `/tee/enclaves/${enclaveId}/verify`,
      data: {},
    });
    return response.data as AttestationReport;
  }

  async destroyEnclave(id: string): Promise<void> {
    await this.sdk.request({ method: 'DELETE', path: `/tee/enclaves/${id}` });
  }
}
