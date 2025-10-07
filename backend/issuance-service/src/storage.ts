import { promises as fs } from 'fs';
import { join } from 'path';
import { Credential, StorageData } from './types';

export class CredentialStorage {
  private filePath: string;
  private data: StorageData;

  constructor(storagePath?: string) {
    this.filePath = storagePath || join(process.cwd(), 'data', 'credentials.json');
    this.data = {
      credentials: new Map(),
      lastWorkerId: 0
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.access(this.filePath);
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Convert object back to Map
      this.data.credentials = new Map(Object.entries(parsed.credentials || {}));
      this.data.lastWorkerId = parsed.lastWorkerId || 0;
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      await this.ensureDirectoryExists();
      await this.save();
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = join(this.filePath, '..');
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async save(): Promise<void> {
    await this.ensureDirectoryExists();

    // Convert Map to object for JSON serialization
    const serializable = {
      credentials: Object.fromEntries(this.data.credentials),
      lastWorkerId: this.data.lastWorkerId
    };

    await fs.writeFile(this.filePath, JSON.stringify(serializable, null, 2));
  }

  async issueCredential(credentialData: Record<string, any>, workerId: string): Promise<Credential> {
    const id = this.generateCredentialId();
    const now = new Date().toISOString();

    const credential: Credential = {
      id,
      data: credentialData,
      issuedAt: now,
      issuedBy: workerId,
      status: 'issued'
    };

    this.data.credentials.set(id, credential);
    await this.save();

    return credential;
  }

  async getCredential(id: string): Promise<Credential | undefined> {
    return this.data.credentials.get(id);
  }

  async credentialExists(id: string): Promise<boolean> {
    return this.data.credentials.has(id);
  }

  getNextWorkerId(): string {
    this.data.lastWorkerId++;
    return `worker-${this.data.lastWorkerId}`;
  }

  private generateCredentialId(): string {
    return `cred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAllCredentials(): Promise<Credential[]> {
    return Array.from(this.data.credentials.values());
  }

  async clearAll(): Promise<void> {
    this.data.credentials.clear();
    this.data.lastWorkerId = 0;
    await this.save();
  }
}
