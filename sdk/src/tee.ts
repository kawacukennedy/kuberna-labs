import { KubernaSDK } from './index.js';
import { KubernaError } from './errors.js';

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

  async createEnclave(_params: CreateEnclaveParams): Promise<Enclave> {
    throw new KubernaError('TEE enclaves are not yet exposed via the API. The TEE service exists server-side but no public route is mounted.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async getEnclave(_id: string): Promise<Enclave> {
    throw new KubernaError('TEE enclaves are not yet exposed via the API.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async listEnclaves(): Promise<Enclave[]> {
    throw new KubernaError('TEE enclaves are not yet exposed via the API.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async verifyAttestation(_enclaveId: string): Promise<AttestationReport> {
    throw new KubernaError('TEE enclaves are not yet exposed via the API.', 'FEATURE_NOT_AVAILABLE', 501);
  }

  async destroyEnclave(_id: string): Promise<void> {
    throw new KubernaError('TEE enclaves are not yet exposed via the API.', 'FEATURE_NOT_AVAILABLE', 501);
  }
}
