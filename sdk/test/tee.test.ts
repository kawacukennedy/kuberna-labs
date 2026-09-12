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

  describe('API not yet mounted', () => {
    it('createEnclave throws FEATURE_NOT_AVAILABLE', async () => {
      await expect(teeManager.createEnclave({ name: 'test', image: 'ubuntu:latest' })).rejects.toMatchObject({
        code: 'FEATURE_NOT_AVAILABLE',
        statusCode: 501,
      });
    });

    it('getEnclave throws FEATURE_NOT_AVAILABLE', async () => {
      await expect(teeManager.getEnclave('enclave-123')).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
    });

    it('listEnclaves throws FEATURE_NOT_AVAILABLE', async () => {
      await expect(teeManager.listEnclaves()).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
    });

    it('verifyAttestation throws FEATURE_NOT_AVAILABLE', async () => {
      await expect(teeManager.verifyAttestation('enclave-123')).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
    });

    it('destroyEnclave throws FEATURE_NOT_AVAILABLE', async () => {
      await expect(teeManager.destroyEnclave('enclave-123')).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
    });
  });
});