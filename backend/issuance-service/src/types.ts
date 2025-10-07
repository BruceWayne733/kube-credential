export interface Credential {
  id: string;
  data: Record<string, any>;
  issuedAt: string;
  issuedBy: string; // worker-n format
  status: 'issued' | 'pending' | 'failed';
}

export interface CredentialRequest {
  data: Record<string, any>;
}

export interface CredentialResponse {
  success: boolean;
  message: string;
  credential?: Credential;
  workerId?: string;
}

export interface StorageData {
  credentials: Map<string, Credential>;
  lastWorkerId: number;
}
