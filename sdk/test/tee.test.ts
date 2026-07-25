import { TeeManager } from '../src/tee.js';

describe('TeeManager', () => {
  let mockSDK: any;
  let teeManager: TeeManager;

  beforeEach(() => {
    mockSDK = {
      request: jest.fn(),
    };

    teeManager = new TeeManager(mockSDK);
  });

  describe('createEnclave', () => {
    it('creates an enclave and returns it', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          id: 'enclave-123',
          name: 'test-enclave',
          status: 'creating',
          image: 'ubuntu:latest',
          memory: 512,
          cpu: 1,
          createdAt: '2024-01-01T00:00:00Z',
        },
      });

      const result = await teeManager.createEnclave({
        name: 'test-enclave',
        image: 'ubuntu:latest',
      });

      expect(result.id).toBe('enclave-123');
      expect(result.status).toBe('creating');
    });
  });

  describe('getEnclave', () => {
    it('returns enclave by id', async () => {
      mockSDK.request.mockResolvedValue({
        data: { id: 'enclave-123', name: 'test', status: 'running' },
      });

      const result = await teeManager.getEnclave('enclave-123');
      expect(result.id).toBe('enclave-123');
    });
  });

  describe('listEnclaves', () => {
    it('returns list of enclaves', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          enclaves: [{ id: '1', name: 'a' }, { id: '2', name: 'b' }],
        },
      });

      const result = await teeManager.listEnclaves();
      expect(result).toHaveLength(2);
    });
  });

  describe('verifyAttestation', () => {
    it('returns attestation report', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          enclaveId: 'enclave-123',
          report: 'report-data',
          verified: true,
          timestamp: '2024-01-01T00:00:00Z',
          measurements: {
            mrEnclave: 'abc',
            mrSigner: 'def',
            isvProdID: '1',
            isvSVN: '2',
          },
        },
      });

      const result = await teeManager.verifyAttestation('enclave-123');
      expect(result.verified).toBe(true);
      expect(result.enclaveId).toBe('enclave-123');
    });
  });

  describe('destroyEnclave', () => {
    it('destroys enclave successfully', async () => {
      mockSDK.request.mockResolvedValue({ data: {} });

      await expect(teeManager.destroyEnclave('enclave-123')).resolves.not.toThrow();
    });
  });
});
