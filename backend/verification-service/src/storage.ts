import { promises as fs } from 'fs';
import { join } from 'path';
import { Credential } from './types';

export interface VerificationStorageData {
  credentials: Map<string, Credential>;
}

export class VerificationStorage {
  private filePath: string;
  private data: VerificationStorageData;

  constructor(storagePath?: string) {
    this.filePath = storagePath || join(process.cwd(), 'data', 'credentials.json');
    this.data = {
      credentials: new Map()
    };
  }

  async initialize(): Promise<void> {
    try {
      await fs.access(this.filePath);
      const fileContent = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(fileContent);

      // Convert object back to Map
      this.data.credentials = new Map(Object.entries(parsed.credentials || {}));
    } catch (error) {
      // File doesn't exist or is invalid, start with empty data
      console.log('No credential data found for verification service');
    }
  }

  async verifyCredentialByData(credentialData: Record<string, any>): Promise<{ isValid: boolean; credential?: Credential }> {
    // Search through all credentials to find one with matching data
    for (const [id, credential] of this.data.credentials.entries()) {
      if (JSON.stringify(credential.data) === JSON.stringify(credentialData) && credential.status === 'issued') {
        return {
          isValid: true,
          credential: {
            id: credential.id,
            data: credential.data,
            issuedAt: credential.issuedAt,
            issuedBy: credential.issuedBy,
            status: credential.status
          }
        };
      }
    }

    return { isValid: false };
  }

  async verifyCredentialById(id: string): Promise<{ isValid: boolean; credential?: Credential }> {
    const credential = this.data.credentials.get(id);

    if (credential && credential.status === 'issued') {
      return {
        isValid: true,
        credential: {
          id: credential.id,
          data: credential.data,
          issuedAt: credential.issuedAt,
          issuedBy: credential.issuedBy,
          status: credential.status
        }
      };
    }

    return { isValid: false };
  }

  async getAllCredentials(): Promise<Credential[]> {
    return Array.from(this.data.credentials.values());
  }

  // Method to sync with issuance service (for demo purposes)
  async syncCredentials(credentials: Credential[]): Promise<void> {
    this.data.credentials.clear();
    credentials.forEach(cred => {
      this.data.credentials.set(cred.id, cred);
    });
  }
}
