// API Response types
export interface CredentialIssuanceRequest {
  data: Record<string, any>;
}

export interface CredentialIssuanceResponse {
  success: boolean;
  message: string;
  credential?: {
    id: string;
    data: Record<string, any>;
    issuedAt: string;
    issuedBy: string;
    status: string;
  };
  workerId?: string;
}

export interface CredentialVerificationRequest {
  id?: string;
  data?: Record<string, any>;
}

export interface CredentialVerificationResponse {
  success: boolean;
  message: string;
  credential?: {
    id: string;
    issuedAt: string;
    issuedBy: string;
    status: string;
  };
  isValid: boolean;
}

// UI State types
export interface FormData {
  userId?: string;
  role?: string;
  department?: string;
  permissions?: string;
  expiryDate?: string;
  credentialId?: string;
}


export interface ValidationErrors {
  [key: string]: string;
}

// Component prop types
export interface CredentialFormProps {
  onSubmit: (data: CredentialIssuanceRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface VerificationFormProps {
  onSubmit: (data: CredentialVerificationRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
}
