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
    it('throws FEATURE_NOT_AVAILABLE (no /certificates router on backend)', async () => {
      await expect(
        certificateManager.mint({ recipientAddress: '0xRecipient0000000000000000000000000000', courseId: 'course-1' })
      ).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE', statusCode: 501 });
    });
  });

  describe('verify', () => {
    it('verifies via identity router', async () => {
      mockSDK.request.mockResolvedValue({
        data: {
          valid: true,
          pubkeyFp: 'fp',
        },
      });

      const result = await certificateManager.verify('cert-123');
      expect(result.valid).toBe(true);
      expect(mockSDK.request).toHaveBeenCalledWith({
        method: 'POST',
        path: '/identity/verify-cert',
        data: { cert: { id: 'cert-123' } },
      });
    });
  });

  describe('getByUser/getByCourse', () => {
    it('throw FEATURE_NOT_AVAILABLE', async () => {
      await expect(certificateManager.getByUser('user-1')).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
      await expect(certificateManager.getByCourse('course-1')).rejects.toMatchObject({ code: 'FEATURE_NOT_AVAILABLE' });
    });
  });
});