import { CredentialStorage } from '../storage';
import { promises as fs } from 'fs';
import { join } from 'path';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  }
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('CredentialStorage', () => {
  let storage: CredentialStorage;
  const testDataPath = join(process.cwd(), 'test-data', 'credentials.json');

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new CredentialStorage(testDataPath);
  });

  describe('initialize', () => {
    it('should initialize with empty data when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));

      await storage.initialize();

      expect(mockFs.access).toHaveBeenCalledWith(testDataPath);
      expect(mockFs.mkdir).toHaveBeenCalled();
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
        },
        lastWorkerId: 1
      };

      mockFs.access.mockResolvedValue(undefined);
      mockFs.readFile.mockResolvedValue(JSON.stringify(existingData));

      await storage.initialize();

      expect(mockFs.access).toHaveBeenCalledWith(testDataPath);
      expect(mockFs.readFile).toHaveBeenCalledWith(testDataPath, 'utf-8');
    });
  });

  describe('issueCredential', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should issue a new credential with worker ID', async () => {
      const credentialData = { userId: 'user123', role: 'admin' };
      const workerId = storage.getNextWorkerId();

      const credential = await storage.issueCredential(credentialData, workerId);

      expect(credential.id).toBeDefined();
      expect(credential.data).toEqual(credentialData);
      expect(credential.issuedBy).toBe(workerId);
      expect(credential.status).toBe('issued');
      expect(credential.issuedAt).toBeDefined();

      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should increment worker ID for each credential', async () => {
      const workerId1 = storage.getNextWorkerId();
      const workerId2 = storage.getNextWorkerId();

      expect(workerId1).toBe('worker-1');
      expect(workerId2).toBe('worker-2');
    });
  });

  describe('getCredential', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should return credential when it exists', async () => {
      const credentialData = { test: 'data' };
      const workerId = storage.getNextWorkerId();
      const issuedCredential = await storage.issueCredential(credentialData, workerId);

      const retrieved = await storage.getCredential(issuedCredential.id);

      expect(retrieved).toEqual(issuedCredential);
    });

    it('should return undefined when credential does not exist', async () => {
      const retrieved = await storage.getCredential('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('credentialExists', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should return true when credential exists', async () => {
      const credentialData = { test: 'data' };
      const workerId = storage.getNextWorkerId();
      const issuedCredential = await storage.issueCredential(credentialData, workerId);

      const exists = await storage.credentialExists(issuedCredential.id);
      expect(exists).toBe(true);
    });

    it('should return false when credential does not exist', async () => {
      const exists = await storage.credentialExists('non-existent-id');
      expect(exists).toBe(false);
    });
  });

  describe('getAllCredentials', () => {
    beforeEach(async () => {
      mockFs.access.mockRejectedValue(new Error('File not found'));
      await storage.initialize();
    });

    it('should return all issued credentials', async () => {
      const credential1 = await storage.issueCredential({ user: '1' }, 'worker-1');
      const credential2 = await storage.issueCredential({ user: '2' }, 'worker-2');

      const allCredentials = await storage.getAllCredentials();

      expect(allCredentials).toHaveLength(2);
      expect(allCredentials).toContainEqual(credential1);
      expect(allCredentials).toContainEqual(credential2);
    });
  });
});
