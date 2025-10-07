import axios from 'axios';
import { credentialService } from '../services/api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CredentialService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('issueCredential', () => {
    it('should successfully issue a credential', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Credential issued by worker-1',
          credential: {
            id: 'cred_123',
            data: { userId: 'testuser' },
            issuedAt: '2023-01-01T00:00:00.000Z',
            issuedBy: 'worker-1',
            status: 'issued'
          }
        }
      };

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.issueCredential({
        data: { userId: 'testuser', role: 'admin' }
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Credential issued by worker-1');
      expect(result.credential?.id).toBe('cred_123');
    });

    it('should handle issuance errors', async () => {
      const errorMessage = 'Credential with identical data has already been issued';

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockRejectedValue({
          response: { data: { message: errorMessage } }
        })
      } as any));

      await expect(credentialService.issueCredential({
        data: { userId: 'testuser' }
      })).rejects.toThrow(errorMessage);
    });

    it('should handle network errors', async () => {
      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockRejectedValue({
          request: {},
          message: 'Network Error'
        })
      } as any));

      await expect(credentialService.issueCredential({
        data: { userId: 'testuser' }
      })).rejects.toThrow('Issuance service is unavailable');
    });
  });

  describe('verifyCredential', () => {
    it('should successfully verify a credential by ID', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Credential is valid',
          isValid: true,
          credential: {
            id: 'cred_123',
            issuedAt: '2023-01-01T00:00:00.000Z',
            issuedBy: 'worker-1',
            status: 'issued'
          }
        }
      };

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.verifyCredential({
        id: 'cred_123'
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
      expect(result.credential?.id).toBe('cred_123');
    });

    it('should successfully verify a credential by data', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Credential is valid',
          isValid: true,
          credential: {
            id: 'cred_123',
            issuedAt: '2023-01-01T00:00:00.000Z',
            issuedBy: 'worker-1',
            status: 'issued'
          }
        }
      };

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.verifyCredential({
        data: { userId: 'testuser', role: 'admin' }
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(true);
    });

    it('should handle verification failure', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Credential is not valid',
          isValid: false
        }
      };

      mockedAxios.create = jest.fn(() => ({
        post: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.verifyCredential({
        data: { userId: 'invalid' }
      });

      expect(result.success).toBe(true);
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Credential is not valid');
    });
  });

  describe('health checks', () => {
    it('should return health status for issuance service', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          service: 'kube-credential-issuance'
        }
      };

      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.checkIssuanceHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('kube-credential-issuance');
    });

    it('should throw error when issuance service is unhealthy', async () => {
      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockRejectedValue(new Error('Service unavailable'))
      } as any));

      await expect(credentialService.checkIssuanceHealth())
        .rejects.toThrow('Issuance service is not healthy');
    });

    it('should return health status for verification service', async () => {
      const mockResponse = {
        data: {
          status: 'ok',
          service: 'kube-credential-verification'
        }
      };

      mockedAxios.create = jest.fn(() => ({
        get: jest.fn().mockResolvedValue(mockResponse)
      } as any));

      const result = await credentialService.checkVerificationHealth();
      expect(result.status).toBe('ok');
      expect(result.service).toBe('kube-credential-verification');
    });
  });
});
