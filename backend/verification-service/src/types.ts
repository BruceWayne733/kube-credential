// -------------------------------
//  Credential & API Core Types
// -------------------------------

export interface Credential {
  id: string;
  data: CredentialData;
  issuedAt: string;
  issuedBy: string; // e.g., "worker-n"
  status: 'issued' | 'pending' | 'failed';
}

// -------------------------------
//  Frontend Form Data Interfaces
// -------------------------------

export interface IssuanceFormData {
  userId: string;
  role: string;
  permissions: string;
  expiryDate: string;
  department: string;
}

export interface VerificationFormData {
  credentialId?: string;
  userId?: string;
  role?: string;
  permissions?: string;
  expiryDate?: string;
  department?: string;
}

// -------------------------------
//  Validation & UI Types
// -------------------------------

export interface ValidationErrors {
  [key: string]: string;
}

// -------------------------------
//  API Request & Response Types
// -------------------------------

export interface CredentialData {
  userId: string;
  role: string;
  permissions: string[];
  expiryDate: string | null;
  department: string;
  issuedAt?: string;
}

export interface CredentialIssuanceRequest {
  data: CredentialData;
}

export interface CredentialIssuanceResponse {
  success: boolean;
  message: string;
  credential?: Credential;
}

export interface CredentialVerificationRequest {
  id?: string;
  data?: CredentialData;
}

export interface CredentialVerificationResponse {
  success: boolean;
  message: string;
  isValid: boolean;
  credential?: {
    id: string;
    issuedAt: string;
    issuedBy: string; // worker-n format
    status: string;
  };
}

export interface VerificationResult {
  isValid: boolean;
  credential?: {
    id: string;
    issuedAt: string;
    issuedBy: string;
    status: string;
  };
}

