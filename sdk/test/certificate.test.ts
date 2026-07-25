import { CertificateManager } from '../src/certificate.js';

describe('CertificateManager', () => {
  let mockSDK: any;
  let certificateManager: CertificateManager;

  beforeEach(() => {
    mockSDK = {
      request: jest.fn(),
    };

    certificateManager = new CertificateManager(mockSDK);
  });

  describe('mint', () => {
    it('mints a certificate and returns it', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          id: 'cert-123',
          tokenId: '1',
          recipient: '0xRecipient0000000000000000000000000000',
          courseId: 'course-1',
          verificationHash: '0xabc',
          chain: 'ethereum',
          transactionHash: '0xtx',
          mintedAt: '2024-01-01T00:00:00Z',
        },
      });

      const result = await certificateManager.mint({
        recipientAddress: '0xRecipient0000000000000000000000000000',
        courseId: 'course-1',
      });

      expect(result.id).toBe('cert-123');
      expect(result.tokenId).toBe('1');
      expect(result.recipient).toBe('0xRecipient0000000000000000000000000000');
    });
  });

  describe('verify', () => {
    it('verifies a certificate', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          valid: true,
          certificate: { id: 'cert-123' },
          issuer: '0xIssuer0000000000000000000000000000000',
          timestamp: '2024-01-01T00:00:00Z',
        },
      });

      const result = await certificateManager.verify('cert-123');
      expect(result.valid).toBe(true);
      expect(result.issuer).toBe('0xIssuer0000000000000000000000000000000');
    });
  });

  describe('getByUser', () => {
    it('returns certificates for a user', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          certificates: [
            { id: 'cert-1', tokenId: '1' },
            { id: 'cert-2', tokenId: '2' },
          ],
        },
      });

      const result = await certificateManager.getByUser('user-1');
      expect(result).toHaveLength(2);
    });
  });

  describe('getByCourse', () => {
    it('returns certificates for a course', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          certificates: [{ id: 'cert-1', tokenId: '1' }],
        },
      });

      const result = await certificateManager.getByCourse('course-1');
      expect(result).toHaveLength(1);
    });
  });
});
