import { VerificationStorage } from '../storage';
import { promises as fs } from 'fs';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('VerificationStorage', () => {
  let storage: VerificationStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new VerificationStorage();
  });

  describe('initialize', () => {
    it('should initialize with empty data when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await storage.initialize();

      expect(mockFs.access).toHaveBeenCalled();
    });

    it('should load existing data when file exists', async () => {
      const existingData = {
        credentials: {
          'test-id': {
            id: 'test-id',
            data: { test: 'data' },
            issuedAt: '2023-01-01T00:00:00.000Z',
            issuedBy: 'worker-1',
            status: 'issued'
          }
        }
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingData));

      await storage.initialize();

      expect(mockFs.access).toHaveBeenCalled();
      expect(mockFs.readFile).toHaveBeenCalled();
    });
  });

  describe('verifyCredentialByData', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should return valid result for matching credential data', async () => {
      const testCredential = {
        id: 'test-id',
        data: { userId: 'user123', role: 'admin' },
        issuedAt: '2023-01-01T00:00:00.000Z',
        issuedBy: 'worker-1',
        status: 'issued'
      };

      // Manually add credential to storage for testing
      storage['data'].credentials.set(testCredential.id, testCredential);

      const result = await storage.verifyCredentialByData(testCredential.data);

      expect(result.isValid).toBe(true);
      expect(result.credential).toBeDefined();
      expect(result.credential?.id).toBe(testCredential.id);
      expect(result.credential?.issuedBy).toBe('worker-1');
    });

    it('should return invalid result for non-matching credential data', async () => {
      const result = await storage.verifyCredentialByData({ userId: 'nonexistent' });

      expect(result.isValid).toBe(false);
      expect(result.credential).toBeUndefined();
    });

    it('should return invalid result for non-issued credential', async () => {
      const testCredential = {
        id: 'test-id',
        data: { userId: 'user123' },
        issuedAt: '2023-01-01T00:00:00.000Z',
        issuedBy: 'worker-1',
        status: 'pending' as const
      };

      storage['data'].credentials.set(testCredential.id, testCredential);

      const result = await storage.verifyCredentialByData(testCredential.data);

      expect(result.isValid).toBe(false);
    });
  });

  describe('verifyCredentialById', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should return valid result for existing issued credential', async () => {
      const testCredential = {
        id: 'test-id',
        data: { userId: 'user123' },
        issuedAt: '2023-01-01T00:00:00.000Z',
        issuedBy: 'worker-1',
        status: 'issued' as const
      };

      storage['data'].credentials.set(testCredential.id, testCredential);

      const result = await storage.verifyCredentialById(testCredential.id);

      expect(result.isValid).toBe(true);
      expect(result.credential?.id).toBe(testCredential.id);
    });

    it('should return invalid result for non-existent credential', async () => {
      const result = await storage.verifyCredentialById('non-existent-id');

      expect(result.isValid).toBe(false);
      expect(result.credential).toBeUndefined();
    });

    it('should return invalid result for non-issued credential', async () => {
      const testCredential = {
        id: 'test-id',
        data: { userId: 'user123' },
        issuedAt: '2023-01-01T00:00:00.000Z',
        issuedBy: 'worker-1',
        status: 'pending' as const
      };

      storage['data'].credentials.set(testCredential.id, testCredential);

      const result = await storage.verifyCredentialById(testCredential.id);

      expect(result.isValid).toBe(false);
    });
  });

  describe('syncCredentials', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should sync credentials and update storage', async () => {
      const credentials = [
        {
          id: 'cred-1',
          data: { userId: 'user1' },
          issuedAt: '2023-01-01T00:00:00.000Z',
          issuedBy: 'worker-1',
          status: 'issued' as const
        },
        {
          id: 'cred-2',
          data: { userId: 'user2' },
          issuedAt: '2023-01-01T00:00:00.000Z',
          issuedBy: 'worker-2',
          status: 'issued' as const
        }
      ];

      await storage.syncCredentials(credentials);

      expect(storage['data'].credentials.size).toBe(2);

      const allCredentials = await storage.getAllCredentials();
      expect(allCredentials).toHaveLength(2);
    });
  });
});
